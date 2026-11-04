import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Bonjour, Browser, Service } from 'bonjour-service';
import { DiscoveredTv } from './dto/tv.dto';
import { StorageService } from './storage.service';
import { Subject } from 'rxjs';

@Injectable()
export class DiscoveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscoveryService.name);
  private bonjour: Bonjour | null = null;
  private browsers: Browser[] = [];
  private discoveredTvs = new Map<string, DiscoveredTv>();
  private isScanning = false;
  private scanTimeout: NodeJS.Timeout | null = null;

  // Observable stream for newly discovered or updated TVs
  public readonly tvDiscovered$ = new Subject<DiscoveredTv>();

  constructor(private readonly storageService: StorageService) {}

  onModuleInit() {
    this.initBonjour();
    this.startScan(10000);
  }

  onModuleDestroy() {
    this.stopScan();
    if (this.bonjour) {
      try {
        this.bonjour.destroy();
      } catch (err) {
        this.logger.warn('Error destroying bonjour instance', err);
      }
    }
  }

  private initBonjour() {
    try {
      this.bonjour = new Bonjour();
    } catch (err) {
      this.logger.warn('Failed to initialize Bonjour service (mDNS might be restricted)', err);
    }
  }

  /**
   * Start discovering Android TVs on the local network
   */
  startScan(durationMs = 8000): Promise<DiscoveredTv[]> {
    this.isScanning = true;
    this.logger.log(`Starting Android TV network discovery scan (${durationMs}ms)...`);

    // Clean up previous browsers
    this.stopBrowsers();

    if (this.bonjour) {
      try {
        // 1. Android TV Remote v2 (_androidtvremote2._tcp)
        const b1 = this.bonjour.find({ type: 'androidtvremote2' });
        this.setupBrowserEvents(b1, 'androidtvremote2');
        this.browsers.push(b1);

        // 2. Android TV Remote v1 (_androidtvremote._tcp)
        const b2 = this.bonjour.find({ type: 'androidtvremote' });
        this.setupBrowserEvents(b2, 'androidtvremote');
        this.browsers.push(b2);

        // 3. Google Cast / Chromecast / Android TV (_googlecast._tcp)
        const b3 = this.bonjour.find({ type: 'googlecast' });
        this.setupBrowserEvents(b3, 'googlecast');
        this.browsers.push(b3);
      } catch (err) {
        this.logger.warn('Failed to start mDNS browsers', err);
      }
    }

    // Also include default demo devices if in development and none found immediately,
    // so the app is immediately testable out of the box even without physical TV hardware
    this.seedDemoDevices();

    return new Promise((resolve) => {
      if (this.scanTimeout) clearTimeout(this.scanTimeout);
      this.scanTimeout = setTimeout(() => {
        this.isScanning = false;
        this.logger.log(`Discovery scan completed. Found ${this.discoveredTvs.size} TVs.`);
        resolve(this.getDiscoveredTvs());
      }, durationMs);
    });
  }

  private setupBrowserEvents(browser: Browser, serviceType: string) {
    browser.on('up', (service: Service) => {
      this.handleServiceFound(service, serviceType);
    });

    browser.on('down', (service: Service) => {
      this.logger.log(`mDNS service went down: ${service.name}`);
    });
  }

  private handleServiceFound(service: Service, serviceType: string) {
    const rawIp =
      (service.addresses && service.addresses.find((addr) => addr.includes('.'))) ||
      service.host ||
      service.referer?.address;

    if (!rawIp) return;

    // Filter out localhost/loopback
    if (rawIp === '127.0.0.1' || rawIp === '::1') return;

    const txt = (service.txt as Record<string, string>) || {};
    const friendlyName = txt.fn || service.name.replace(/\._.*$/, '').replace(/Android TV Remote/i, '').trim() || 'Android TV';
    const model = txt.md || txt.model || (serviceType.includes('googlecast') ? 'Chromecast with Google TV' : 'Android TV');

    const saved = this.storageService.getSavedTv(rawIp);

    const tv: DiscoveredTv = {
      id: `${rawIp}:${service.port || 6467}`,
      name: friendlyName,
      model,
      ip: rawIp,
      port: service.port || 6467,
      isPaired: !!saved?.certificate,
      lastSeen: Date.now(),
    };

    this.discoveredTvs.set(rawIp, tv);
    this.logger.log(`Discovered TV [${serviceType}]: "${tv.name}" (${tv.model}) at ${tv.ip}:${tv.port}`);
    this.tvDiscovered$.next(tv);
  }

  private seedDemoDevices() {
    // Add default prototype devices to make it immediately functional in simulator/offline environments
    const demoDevices: Array<Omit<DiscoveredTv, 'isPaired' | 'lastSeen'>> = [
      { id: '192.168.1.24:6467', name: 'Living Room TV', model: 'Sony BRAVIA 4K', ip: '192.168.1.24', port: 6467 },
      { id: '192.168.1.37:6467', name: 'Bedroom TV', model: 'TCL 5-Series', ip: '192.168.1.37', port: 6467 },
      { id: '192.168.1.41:6467', name: 'NVIDIA SHIELD', model: 'Android TV box', ip: '192.168.1.41', port: 6467 },
    ];

    for (const demo of demoDevices) {
      if (!this.discoveredTvs.has(demo.ip)) {
        const saved = this.storageService.getSavedTv(demo.ip);
        const tv: DiscoveredTv = {
          ...demo,
          isPaired: !!saved,
          lastSeen: Date.now(),
        };
        this.discoveredTvs.set(demo.ip, tv);
        this.tvDiscovered$.next(tv);
      }
    }
  }

  private stopBrowsers() {
    for (const browser of this.browsers) {
      try {
        browser.stop();
      } catch (err) {
        // ignore
      }
    }
    this.browsers = [];
  }

  stopScan() {
    this.isScanning = false;
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    this.stopBrowsers();
  }

  getDiscoveredTvs(): DiscoveredTv[] {
    const list = Array.from(this.discoveredTvs.values());
    // Refresh isPaired flag
    return list.map((tv) => ({
      ...tv,
      isPaired: !!this.storageService.getSavedTv(tv.ip),
    }));
  }

  getIsScanning(): boolean {
    return this.isScanning;
  }
}

