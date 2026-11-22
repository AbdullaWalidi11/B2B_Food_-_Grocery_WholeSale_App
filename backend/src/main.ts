// backend/src/main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ==========================================
  // 1. HTTP SECURITY HEADERS (Helmet)
  // ==========================================
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false, // Keeps Swagger UI working smoothly
    }),
  );

  // ==========================================
  // 2. CORS FOR FRONTEND
  // ==========================================
     const configuredOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
    : [];

  app.enableCors({
    origin: (origin: any, callback: any) => {
      // Allow requests with no origin (Postman, mobile, curl)
      if (!origin) return callback(null, true);

      // Automatically allow all Vercel domains, localhost, and configured URLs
      if (
        origin.includes('localhost') ||
        origin.endsWith('.vercel.app') ||
        configuredOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ==========================================
  // 3. GLOBAL VALIDATION PIPES
  // ==========================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ==========================================
  // 4. SWAGGER DOCUMENTATION
  // ==========================================
  const config = new DocumentBuilder()
    .setTitle('B2B Food & Grocery Wholesale API')
    .setDescription(
      'Multi-Vendor Marketplace API: Vendors, Restaurants, Cari Hesap & Dynamic Pricing',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 NestJS Backend running on: http://localhost:${port}`);
  console.log(`📑 Swagger Documentation available at: http://localhost:${port}/api`);
}
bootstrap();