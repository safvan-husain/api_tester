import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Changed
import { CheckpointService } from './checkpoint.service';
import { CheckpointController } from './checkpoint.controller';
import { Checkpoint, CheckpointModel } from './entities/checkpoint.entity'; // Import CheckpointModel
import { RequestModule } from '../request/request.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Checkpoint.name, schema: CheckpointModel.schema },
    ]), // Changed
    RequestModule,
  ],
  controllers: [CheckpointController],
  providers: [CheckpointService],
  exports: [
    CheckpointService,
    MongooseModule.forFeature([
      { name: Checkpoint.name, schema: CheckpointModel.schema },
    ]),
  ],
})
export class CheckpointModule {}
