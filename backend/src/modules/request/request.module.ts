import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Changed
import { RequestService } from './request.service';
import { RequestController } from './request.controller';
import { Request, RequestModel } from './entities/request.entity'; // Import RequestModel

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Request.name, schema: RequestModel.schema },
    ]), // Changed
  ],
  controllers: [RequestController],
  providers: [RequestService],
  // Export service and MongooseModule for CheckpointModule
  exports: [
    RequestService,
    MongooseModule.forFeature([
      { name: Request.name, schema: RequestModel.schema },
    ]),
  ],
})
export class RequestModule {}
