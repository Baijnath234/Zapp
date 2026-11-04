import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SavedTvEntity } from '../tv/entities/saved-tv.entity';
import { SettingEntity } from '../tv/entities/setting.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const host = config.get<string>('DATABASE_HOST', 'localhost');
        const port = Number(config.get<number>('DATABASE_PORT', 5433));
        const username = config.get<string>('DATABASE_USER', 'zapp_user');
        const password = config.get<string>('DATABASE_PASSWORD', 'zapp_secret');
        const database = config.get<string>('DATABASE_NAME', 'zapp_db');
        const synchronize = config.get<string>('DATABASE_SYNCHRONIZE', 'true') === 'true';

        logger.log(`Connecting to PostgreSQL on ${host}:${port}/${database}...`);

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [SavedTvEntity, SettingEntity],
          synchronize,
          retryAttempts: 10,
          retryDelay: 3000,
          autoLoadEntities: true,
          logging: config.get<string>('DATABASE_LOGGING') === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}

