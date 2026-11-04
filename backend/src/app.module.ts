import { Module } from '@nestjs/common';
import { TvModule } from './tv/tv.module';

@Module({
  imports: [TvModule],
})
export class AppModule {}

