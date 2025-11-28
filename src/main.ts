import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 1. Habilitar CORS (Configuración Robusta)
  // Esto permite que tu Frontend (localhost:5173 o similar) se comunique bien
  app.enableCors({
    origin: true, // Permite cualquier origen en desarrollo (o pon 'http://localhost:5173')
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. Versionado
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // 3. Pipes (Validación Global)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 4. Swagger
  const config = new DocumentBuilder()
    .setTitle('Pokemon API')
    .setDescription('API para la gestión de Pokémones')
    .setVersion('1.3')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // 5. Iniciar Servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📑 Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap();
