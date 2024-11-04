import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: console,
  });
  app.use(cors());

  app.use(cookieParser());
  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
    credentials: true,
  });

  // Configurer CORS
  app.enableCors({
    origin: ['https://recette.krissclotilde.com', 'https://www.recette.krissclotilde.com'],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  });

  await app.listen(3007);
}
bootstrap();
