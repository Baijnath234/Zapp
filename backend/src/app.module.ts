import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TvModule } from './tv/tv.module';
import { AppController } from './app.controller';

@Module({
  imports: [DatabaseModule, TvModule],
  controllers: [AppController],
})
export class AppModule {}
