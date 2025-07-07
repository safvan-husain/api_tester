/**
 * Defines the structure for application configuration variables.
 */
export interface AppConfig {
  /**
   * The port number on which the application server will listen.
   */
  port: number;
  /**
   * The MongoDB connection URI.
   */
  mongodb_uri: string;
}
