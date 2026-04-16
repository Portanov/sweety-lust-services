import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { fastifyCompress } from '@fastify/compress';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const adapter = new FastifyAdapter({ logger: true });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  const fastifyInstance = app.getHttpAdapter().getInstance();

  await fastifyInstance.register(helmet);

  await fastifyInstance.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Demasiadas solicitudes, intenta más tarde',
    }),
  });

  // ✅ Configuración SIMPLIFICADA (sin brotli ni zlib)
  await fastifyInstance.register(fastifyCompress, {
    global: true,
    threshold: 512,
    encodings: ['gzip', 'deflate'],
  });

  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  await app.listen(3000, '0.0.0.0');
  logger.log('🚀 Servidor corriendo en http://0.0.0.0:3000/api');
}
bootstrap();