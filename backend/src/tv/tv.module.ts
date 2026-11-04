import { Module } from '@nestjs/common';
import { TvService } from './tv.service';
import { TvController } from './tv.controller';
import { TvGateway } from './tv.gateway';
import { DiscoveryService } from './discovery.service';
import { StorageService } from './storage.service';

@Module({
  controllers: [TvController],
  providers: [TvService, TvGateway, DiscoveryService, StorageService],
  exports: [TvService, DiscoveryService, StorageService],
})
export class TvModule {}

