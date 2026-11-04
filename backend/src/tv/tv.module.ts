import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TvService } from './tv.service';
import { TvController } from './tv.controller';
import { TvGateway } from './tv.gateway';
import { DiscoveryService } from './discovery.service';
import { StorageService } from './storage.service';
import { SavedTvEntity } from './entities/saved-tv.entity';
import { SettingEntity } from './entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedTvEntity, SettingEntity])],
  controllers: [TvController],
  providers: [TvService, TvGateway, DiscoveryService, StorageService],
  exports: [TvService, DiscoveryService, StorageService],
})
export class TvModule {}
