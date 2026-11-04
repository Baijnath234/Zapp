import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Use ws-based WebSocket adapter as requested
  app.useWebSocketAdapter(new WsAdapter(app));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Zapp Backend server running at http://localhost:${port}`);
  logger.log(`🔌 WebSocket server available at ws://localhost:${port}/ws`);
  logger.log(`📺 Ready for Android TV connection & Bonjour network discovery`);
}
bootstrap();

