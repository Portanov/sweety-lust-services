import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { fastifyCompress } from '@fastify/compress';
import type { FastifyRequest } from 'fastify';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Inicializamos el adaptador de Fastify
  const adapter = new FastifyAdapter({ logger: true });

  /**
   * Registro de Plugins
   * Usamos 'as any' para evitar el error de incompatibilidad de tipos entre
   * las definiciones de RawServer de Fastify y el adaptador de NestJS.
   */

  await adapter.register(helmet as any);

  await adapter.register(rateLimit as any, {
    max: 60,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Demasiadas solicitudes, intenta más tarde',
    }),
  });

  await adapter.register(fastifyCompress as any, {
    global: true,
    threshold: 512,
    encodings: ['gzip', 'deflate'],
    brotli: false,
    zlib: {
      level: 6,
      memLevel: 8,
    },
    filter: (req: FastifyRequest) => {
      return req.method === 'GET' || req.method === 'POST';
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
  );

  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://sweetylust.com',
      'https://api.sweetylust.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  await app.listen(3000, '0.0.0.0');

  logger.log('🚀 Servidor corriendo en http://localhost:3000/api');
}

bootstrap();
