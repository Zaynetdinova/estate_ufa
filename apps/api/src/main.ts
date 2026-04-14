import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security ──────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false, // нужно для Swagger UI
      contentSecurityPolicy:     false, // настраивается отдельно под Next.js
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────────────
  app.enableCors({
    origin:      process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── Validation ────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:           true,
      forbidNonWhitelisted: false,
      transform:           true,
    }),
  );

  app.useGlobalInterceptors(new BigIntInterceptor());

  // ── Swagger ───────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Estate AI API')
      .setDescription('AI-платформа подбора новостроек Уфы')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`API running: http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger:     http://localhost:${port}/api/docs`);
  }
}

bootstrap();
