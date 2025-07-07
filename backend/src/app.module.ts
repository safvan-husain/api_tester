import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Changed
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestModule } from './modules/request/request.module';
import { CheckpointModule } from './modules/checkpoint/checkpoint.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({ // Changed
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('mongodb_uri'),
        // Add other Mongoose options here if needed e.g.
        // useNewUrlParser: true, // No longer needed in recent Mongoose versions
        // useUnifiedTopology: true, // No longer needed
      }),
      inject: [ConfigService],
    }),
    RequestModule,
    CheckpointModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
