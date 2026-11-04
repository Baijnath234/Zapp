import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { SavedTv, TvSettingsDto } from './dto/tv.dto';

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
  private readonly filePath = path.join(this.dataDir, 'zapp-storage.json');

  private memoryData: StorageData = {
    savedTvs: [],
    lastConnectedIp: null,
    settings: {
      autoReconnect: true,
      wakeOnConnect: false,
      hapticFeedback: true,
    },
  };

  onModuleInit() {
    this.loadData();
  }

  private loadData(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.memoryData = {
          savedTvs: Array.isArray(parsed.savedTvs) ? parsed.savedTvs : [],
          lastConnectedIp: parsed.lastConnectedIp || null,
          settings: {
            ...this.memoryData.settings,
            ...(parsed.settings || {}),
          },
        };
        this.logger.log(`Loaded ${this.memoryData.savedTvs.length} saved TVs from storage`);
      } else {
        this.saveData();
      }
    } catch (error) {
      this.logger.error('Failed to load storage file, using defaults', error);
    }
  }

  private saveData(): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.memoryData, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('Failed to write storage file', error);
    }
  }

  getSavedTvs(): SavedTv[] {
    return this.memoryData.savedTvs;
  }

  getSavedTv(ip: string): SavedTv | undefined {
    return this.memoryData.savedTvs.find((tv) => tv.ip === ip);
  }

  saveTv(tv: Omit<SavedTv, 'pairedAt'> & { pairedAt?: number }): void {
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
    this.saveData();
  }

  removeSavedTv(ip: string): boolean {
    const prevLen = this.memoryData.savedTvs.length;
    this.memoryData.savedTvs = this.memoryData.savedTvs.filter((t) => t.ip !== ip);
    if (this.memoryData.lastConnectedIp === ip) {
      this.memoryData.lastConnectedIp = this.memoryData.savedTvs[0]?.ip || null;
    }
    if (this.memoryData.savedTvs.length !== prevLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  getLastConnectedIp(): string | null {
    return this.memoryData.lastConnectedIp;
  }

  setLastConnectedIp(ip: string | null): void {
    this.memoryData.lastConnectedIp = ip;
    this.saveData();
  }

  getSettings(): StorageData['settings'] {
    return { ...this.memoryData.settings };
  }

  updateSettings(settings: TvSettingsDto): StorageData['settings'] {
    this.memoryData.settings = {
      ...this.memoryData.settings,
      ...settings,
    };
    this.saveData();
    return this.getSettings();
  }
}

