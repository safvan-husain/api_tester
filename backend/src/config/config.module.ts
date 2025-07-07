import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

@Global() // Make ConfigService available globally
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
