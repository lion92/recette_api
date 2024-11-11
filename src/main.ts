import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: console,
  });

  // Configurer la limite de taille de la charge utile
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.use(cors());
  app.use(cookieParser());

  // Configurer CORS
  app.enableCors({
    origin: ['https://recette.krissclotilde.com', 'https://www.recette.krissclotilde.com', 'http://localhost:3007'],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });

  await app.listen(3007);
}
bootstrap();
