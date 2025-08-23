import { OperationMode, EnvironmentConfig } from "@shared/schema";

// Get environment mode from environment variable or default to MOCKUP
export const getEnvironmentMode = (): OperationMode => {
  const mode = process.env.MODE as OperationMode;
  if (['MOCKUP', 'DEV', 'PROD'].includes(mode)) {
    return mode;
  }
  return 'MOCKUP'; // Default for demos and development
};

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const mode = getEnvironmentMode();
  
  const baseConfig: EnvironmentConfig = {
    mode,
    retentionDays: parseInt(process.env.RETENTION_DAYS || '30'),
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
        },
      };
    
    default:
      return baseConfig;
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