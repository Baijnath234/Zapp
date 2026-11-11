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
        const databaseUrl = config.get<string>('DATABASE_URL');
        const synchronize = config.get<string>('DATABASE_SYNCHRONIZE', 'true') === 'true';
        const isProd = config.get<string>('NODE_ENV') === 'production';
        const sslSetting = config.get<string>('DATABASE_SSL');
        const enableSsl =
          sslSetting === 'true'
            ? true
            : sslSetting === 'false'
            ? false
            : (databaseUrl && (databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true'))) ||
              (isProd && !!databaseUrl && !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1'));

        const sslOptions = enableSsl ? { rejectUnauthorized: false } : false;

        if (databaseUrl) {
          logger.log(`Connecting to PostgreSQL via DATABASE_URL (SSL: ${enableSsl ? 'enabled' : 'disabled'})...`);
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [SavedTvEntity, SettingEntity],
            synchronize,
            retryAttempts: 10,
            retryDelay: 3000,
            autoLoadEntities: true,
            ssl: sslOptions,
            extra: enableSsl ? { ssl: { rejectUnauthorized: false } } : undefined,
            logging: config.get<string>('DATABASE_LOGGING') === 'true',
          };
        }

        const host = config.get<string>('DATABASE_HOST', 'localhost');
        const port = Number(config.get<number>('DATABASE_PORT', 5433));
        const username = config.get<string>('DATABASE_USER', 'zapp_user');
        const password = config.get<string>('DATABASE_PASSWORD', 'zapp_secret');
        const database = config.get<string>('DATABASE_NAME', 'zapp_db');

        logger.log(`Connecting to PostgreSQL on ${host}:${port}/${database} (SSL: ${enableSsl ? 'enabled' : 'disabled'})...`);

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
          ssl: sslOptions,
          extra: enableSsl ? { ssl: { rejectUnauthorized: false } } : undefined,
          logging: config.get<string>('DATABASE_LOGGING') === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}

