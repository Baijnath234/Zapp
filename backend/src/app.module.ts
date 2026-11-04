import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TvModule } from './tv/tv.module';

@Module({
  imports: [DatabaseModule, TvModule],
})
export class AppModule {}
