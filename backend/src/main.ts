import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Trust reverse proxy headers (X-Forwarded-For, X-Forwarded-Proto) for Cloudflare, AWS ALB, Caddy, Nginx, Railway, Render
  const expressApp = app.getHttpAdapter().getInstance();
  if (expressApp && typeof expressApp.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

  // Cross-Origin Resource Sharing (CORS) for web/mobile and cloud environments
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Use ws-based WebSocket adapter as requested
  app.useWebSocketAdapter(new WsAdapter(app));

  const port = process.env.PORT || 3000;
  // Bind to 0.0.0.0 so Docker containers, cloud platforms, and local Wi-Fi clients can connect
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Zapp Backend server running at http://0.0.0.0:${port}`);
  logger.log(`🔌 WebSocket server available at /ws`);
  logger.log(`📺 Ready for Android TV connection & Bonjour network discovery`);
}
bootstrap();

