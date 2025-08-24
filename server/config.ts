import { OperationMode, EnvironmentConfig } from "@shared/schema";
import { validateEnvironmentConfig, logConfigurationSummary, type ValidatedEnvironmentConfig } from "./config-validator";

// Get environment mode from environment variable or default to MOCKUP
export const getEnvironmentMode = (): OperationMode => {
  const mode = process.env.MODE as OperationMode;
  if (['MOCKUP', 'DEV', 'PROD'].includes(mode)) {
    return mode;
  }
  return 'MOCKUP'; // Default for demos and development
};

// Build raw configuration from environment variables
const buildRawConfig = (): any => {
  const mode = getEnvironmentMode();
  
  const baseConfig = {
    mode,
    retentionDays: parseInt(process.env.RETENTION_DAYS || '30'),
    port: parseInt(process.env.PORT || '5000'),
    logLevel: process.env.LOG_LEVEL || 'debug',
  };

  switch (mode) {
    case 'MOCKUP':
      return {
        ...baseConfig,
        mockDataSeed: parseInt(process.env.MOCK_DATA_SEED || '12345'),
      };
    
    case 'DEV':
      return {
        ...baseConfig,
        database: {
          host: process.env.DEV_DB_HOST || 'localhost',
          port: parseInt(process.env.DEV_DB_PORT || '5432'),
          database: process.env.DEV_DB_NAME || 'delivery_dev',
          username: process.env.DEV_DB_USER || 'dev_user',
          password: process.env.DEV_DB_PASSWORD || 'dev_password',
          poolMin: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : undefined,
          poolMax: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : undefined,
        },
      };
    
    case 'PROD':
      return {
        ...baseConfig,
        database: {
          host: process.env.PROD_DB_HOST || 'localhost',
          port: parseInt(process.env.PROD_DB_PORT || '5432'),
          database: process.env.PROD_DB_NAME || 'delivery_prod',
          username: process.env.PROD_DB_USER || 'prod_user',
          password: process.env.PROD_DB_PASSWORD || '',
          poolMin: process.env.DB_POOL_MIN ? parseInt(process.env.DB_POOL_MIN) : undefined,
          poolMax: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : undefined,
          ssl: process.env.DB_SSL === 'true',
          sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        },
      };
    
    default:
      return baseConfig;
  }
};

// Cached validated configuration
let cachedConfig: ValidatedEnvironmentConfig | null = null;

export const getEnvironmentConfig = (): EnvironmentConfig => {
  if (!cachedConfig) {
    const rawConfig = buildRawConfig();
    
    try {
      // Validate configuration on first access
      cachedConfig = validateEnvironmentConfig(rawConfig);
      
      // Log configuration summary on successful validation
      logConfigurationSummary(cachedConfig);
    } catch (error) {
      console.error('Failed to validate environment configuration');
      process.exit(1); // Exit if configuration is invalid
    }
  }
  
  // Convert validated config to EnvironmentConfig type for backward compatibility
  const config = cachedConfig;
  const baseConfig: EnvironmentConfig = {
    mode: config.mode,
    retentionDays: config.retentionDays,
  };
  
  if (config.mode === 'MOCKUP') {
    return {
      ...baseConfig,
      mockDataSeed: config.mockDataSeed,
    };
  } else {
    return {
      ...baseConfig,
      database: config.database,
    };
  }
};

// Logging configuration
export const isDebugMode = (): boolean => {
  const mode = getEnvironmentMode();
  return mode === 'MOCKUP' || mode === 'DEV';
};

export const getLogLevel = (): string => {
  const mode = getEnvironmentMode();
  return mode === 'PROD' ? 'warn' : 'debug';
};