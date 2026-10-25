// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres antes de iniciar a API.');
  }

  const app = await NestFactory.create(AppModule);

  // Habilita CORS para clientes web (React, Vue, Next.js)
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Prefixo global da API REST
  app.setGlobalPrefix('api/v1');

  // Pipeline Global de Validação com tratamento de erros amigáveis
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Remove propriedades desconhecidas não declaradas nos DTOs
      forbidNonWhitelisted: true,    // Retorna Bad Request caso receba campos não permitidos
      transform: true,               // Transforma payloads de acordo com tipos do TypeScript
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 ERP PME Backend em execução na porta: ${port}`);
  console.log(`📡 Endpoints disponíveis sob o prefixo: http://localhost:${port}/api/v1`);
}

bootstrap();
