import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RequesterController } from './requester.controller';
import { RequesterService } from './requester.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000, // Default timeout for HTTP requests
      maxRedirects: 5, // Default max redirects
    }),
  ],
  controllers: [RequesterController],
  providers: [RequesterService],
})
export class RequesterModule {}
