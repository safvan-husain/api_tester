import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get('port');

  app.enableCors(); // Enable CORS for frontend interaction
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties not defined in DTOs
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
      transform: true, // Automatically transforms payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Allows for implicit type conversion based on TS type
      },
    }),
  );

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
