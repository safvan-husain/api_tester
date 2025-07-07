import { Injectable } from '@nestjs/common';
import { AppConfig } from './config.interface';

/**
 * Service responsible for providing application configuration values.
 * It retrieves configuration from environment variables or uses default values.
 */
@Injectable()
export class ConfigService {
  private readonly envConfig: AppConfig;

  /**
   * Initializes the ConfigService by loading environment variables
   * or setting default values for port and MongoDB URI.
   */
  constructor() {
    this.envConfig = {
      port: parseInt(process.env.PORT || '3001', 10),
      mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/api-tester',
    };
  }

  /**
   * Retrieves a configuration value by its key.
   * @param key - The key of the configuration property to retrieve.
   * @returns The value of the configuration property.
   */
  get(key: keyof AppConfig): any {
    return this.envConfig[key];
  }
}
