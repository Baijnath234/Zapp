import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { SavedTv, TvSettingsDto } from './dto/tv.dto';
import { SavedTvEntity } from './entities/saved-tv.entity';
import { SettingEntity } from './entities/setting.entity';

interface StorageData {
  savedTvs: SavedTv[];
  lastConnectedIp: string | null;
  settings: {
    autoReconnect: boolean;
    wakeOnConnect: boolean;
    hapticFeedback: boolean;
  };
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly fallbackFilePath = path.join(this.dataDir, 'zapp-storage.json');

  private isDbConnected = false;

  private memoryData: StorageData = {
    savedTvs: [],
    lastConnectedIp: null,
    settings: {
      autoReconnect: true,
      wakeOnConnect: false,
      hapticFeedback: true,
    },
  };

  constructor(
    @InjectRepository(SavedTvEntity)
    private readonly savedTvRepo: Repository<SavedTvEntity>,
    @InjectRepository(SettingEntity)
    private readonly settingRepo: Repository<SettingEntity>,
  ) {}

  async onModuleInit() {
    this.loadFallbackFile();
    await this.syncFromDatabase();
  }

  private async syncFromDatabase(): Promise<void> {
    try {
      // 1. Fetch saved TVs from Postgres
      const tvEntities = await this.savedTvRepo.find();
      if (tvEntities && tvEntities.length > 0) {
        this.memoryData.savedTvs = tvEntities.map((entity) => ({
          ip: entity.ip,
          name: entity.name,
          model: entity.model,
          certificate: entity.certificate,
          pairedAt: Number(entity.pairedAt),
          lastConnected: entity.lastConnected ? Number(entity.lastConnected) : undefined,
        }));
        this.memoryData.lastConnectedIp = this.memoryData.savedTvs[0]?.ip || null;
        this.logger.log(`Loaded ${this.memoryData.savedTvs.length} saved TVs from PostgreSQL database`);
      } else if (this.memoryData.savedTvs.length > 0) {
        // If DB is fresh and fallback had saved TVs, populate Postgres
        for (const tv of this.memoryData.savedTvs) {
          await this.savedTvRepo.save({
            ip: tv.ip,
            name: tv.name,
            model: tv.model,
            certificate: tv.certificate,
            pairedAt: tv.pairedAt || Date.now(),
            lastConnected: tv.lastConnected,
          });
        }
        this.logger.log(`Migrated ${this.memoryData.savedTvs.length} local TVs to PostgreSQL`);
      }

      // 2. Fetch settings from Postgres
      const settingEntities = await this.settingRepo.find();
      for (const item of settingEntities) {
        try {
          const parsed = JSON.parse(item.value);
          if (item.key in this.memoryData.settings) {
            (this.memoryData.settings as any)[item.key] = parsed;
          }
        } catch {
          // ignore parsing error
        }
      }

      this.isDbConnected = true;
      this.logger.log('PostgreSQL storage synchronization complete');
    } catch (err: any) {
      this.isDbConnected = false;
      this.logger.warn(`Could not sync with PostgreSQL (${err.message}). Using local storage fallback.`);
    }
  }

  private loadFallbackFile(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.fallbackFilePath)) {
        const raw = fs.readFileSync(this.fallbackFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryData = {
          savedTvs: Array.isArray(parsed.savedTvs) ? parsed.savedTvs : [],
          lastConnectedIp: parsed.lastConnectedIp || null,
          settings: {
            ...this.memoryData.settings,
            ...(parsed.settings || {}),
          },
        };
      }
    } catch (error) {
      this.logger.error('Failed to load fallback storage file', error);
    }
  }

  private saveFallbackFile(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.fallbackFilePath, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('Failed to write fallback storage file', error);
    }
  }

  getSavedTvs(): SavedTv[] {
    return this.memoryData.savedTvs;
  }

  getSavedTv(ip: string): SavedTv | undefined {
    return this.memoryData.savedTvs.find((tv) => tv.ip === ip);
  }

  async saveTv(tv: Omit<SavedTv, 'pairedAt'> & { pairedAt?: number }): Promise<void> {
    const existingIndex = this.memoryData.savedTvs.findIndex((t) => t.ip === tv.ip);
    const entry: SavedTv = {
      ip: tv.ip,
      name: tv.name || 'Android TV',
      model: tv.model || 'Android TV',
      certificate: tv.certificate,
      pairedAt: tv.pairedAt || Date.now(),
      lastConnected: Date.now(),
    };

    if (existingIndex >= 0) {
      this.memoryData.savedTvs[existingIndex] = {
        ...this.memoryData.savedTvs[existingIndex],
        ...entry,
      };
    } else {
      this.memoryData.savedTvs.push(entry);
    }
    this.memoryData.lastConnectedIp = tv.ip;
    this.saveFallbackFile();

    // Persist to PostgreSQL
    try {
      await this.savedTvRepo.save({
        ip: entry.ip,
        name: entry.name,
        model: entry.model,
        certificate: entry.certificate,
        pairedAt: entry.pairedAt,
        lastConnected: entry.lastConnected,
      });
      this.logger.log(`Persisted TV "${entry.name}" (${entry.ip}) to PostgreSQL`);
    } catch (err: any) {
      this.logger.warn(`Failed to persist TV to PostgreSQL: ${err.message}`);
    }
  }

  async removeSavedTv(ip: string): Promise<boolean> {
    const prevLen = this.memoryData.savedTvs.length;
    this.memoryData.savedTvs = this.memoryData.savedTvs.filter((t) => t.ip !== ip);
    if (this.memoryData.lastConnectedIp === ip) {
      this.memoryData.lastConnectedIp = this.memoryData.savedTvs[0]?.ip || null;
    }

    if (this.memoryData.savedTvs.length !== prevLen) {
      this.saveFallbackFile();

      // Remove from PostgreSQL
      try {
        await this.savedTvRepo.delete({ ip });
        this.logger.log(`Removed TV (${ip}) from PostgreSQL`);
      } catch (err: any) {
        this.logger.warn(`Failed to delete TV from PostgreSQL: ${err.message}`);
      }

      return true;
    }
    return false;
  }

  getLastConnectedIp(): string | null {
    return this.memoryData.lastConnectedIp;
  }

  setLastConnectedIp(ip: string | null): void {
    this.memoryData.lastConnectedIp = ip;
    this.saveFallbackFile();
  }

  getSettings(): StorageData['settings'] {
    return { ...this.memoryData.settings };
  }

  async updateSettings(settings: TvSettingsDto): Promise<StorageData['settings']> {
    this.memoryData.settings = {
      ...this.memoryData.settings,
      ...settings,
    };
    this.saveFallbackFile();

    // Persist settings to PostgreSQL
    try {
      for (const [key, val] of Object.entries(settings)) {
        if (val !== undefined) {
          await this.settingRepo.save({
            key,
            value: JSON.stringify(val),
          });
        }
      }
      this.logger.log('Persisted updated settings to PostgreSQL');
    } catch (err: any) {
      this.logger.warn(`Failed to save settings to PostgreSQL: ${err.message}`);
    }

    return this.getSettings();
  }
}
