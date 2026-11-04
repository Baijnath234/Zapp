import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  private readonly startTime = Date.now();

  @Get()
  getRoot() {
    return {
      service: 'zapp-backend',
      status: 'online',
      version: '1.0.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'zapp-backend',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}

