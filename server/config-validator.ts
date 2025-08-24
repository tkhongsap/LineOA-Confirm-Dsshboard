import { z } from "zod";
import { OperationMode } from "@shared/schema";

// Base configuration schema
const baseConfigSchema = z.object({
  mode: z.enum(['MOCKUP', 'DEV', 'PROD']),
  retentionDays: z.number().min(1).max(365).default(30),
  port: z.number().min(1).max(65535).default(5000),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
});

// Mockup mode configuration schema
const mockupConfigSchema = baseConfigSchema.extend({
  mode: z.literal('MOCKUP'),
  mockDataSeed: z.number().int().positive().default(12345),
});

// Database configuration schema
const databaseConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().min(1).max(65535),
  database: z.string().min(1),
  username: z.string().min(1),
  password: z.string(),
  poolMin: z.number().min(1).default(2).optional(),
  poolMax: z.number().min(1).default(10).optional(),
  ssl: z.boolean().default(false).optional(),
  sslRejectUnauthorized: z.boolean().default(true).optional(),
});

// Development mode configuration schema
const devConfigSchema = baseConfigSchema.extend({
  mode: z.literal('DEV'),
  database: databaseConfigSchema,
});

// Production mode configuration schema
const prodConfigSchema = baseConfigSchema.extend({
  mode: z.literal('PROD'),
  database: databaseConfigSchema,
  // Additional production-specific validations
  logLevel: z.enum(['warn', 'error']), // Restrict log levels in production
});

// Union type for all configuration modes
export const environmentConfigSchema = z.discriminatedUnion('mode', [
  mockupConfigSchema,
  devConfigSchema,
  prodConfigSchema,
]);

export type ValidatedEnvironmentConfig = z.infer<typeof environmentConfigSchema>;

// Validation function with detailed error reporting
export function validateEnvironmentConfig(config: any): ValidatedEnvironmentConfig {
  try {
    return environmentConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment Configuration Validation Failed:');
      console.error('═══════════════════════════════════════════════');
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        console.error(`  • ${path || 'root'}: ${err.message}`);
      });
      
      console.error('═══════════════════════════════════════════════');
      console.error('\nPlease check your environment configuration and ensure all required fields are properly set.');
      console.error('Refer to SETUP.md for detailed configuration instructions.\n');
      
      throw new Error(`Configuration validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

// Helper function to validate database connectivity (optional, for runtime checks)
export async function validateDatabaseConnection(config: any): Promise<boolean> {
  if (config.mode === 'MOCKUP') {
    return true; // No database connection needed for mockup mode
  }

  // This would be implemented with actual database connection logic
  // For now, it's a placeholder
  console.log(`[Config Validator] Would validate database connection for ${config.mode} mode`);
  console.log(`[Config Validator] Database: ${config.database?.host}:${config.database?.port}/${config.database?.database}`);
  
  // In a real implementation, you would:
  // 1. Attempt to connect to the database
  // 2. Run a simple query (e.g., SELECT 1)
  // 3. Return true if successful, false otherwise
  
  return true;
}

// Helper function to log configuration summary (with sensitive data masked)
export function logConfigurationSummary(config: ValidatedEnvironmentConfig): void {
  console.log('\n📋 Configuration Summary:');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Mode: ${config.mode}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Log Level: ${config.logLevel}`);
  console.log(`  Retention Days: ${config.retentionDays}`);
  
  if (config.mode === 'MOCKUP') {
    console.log(`  Mock Data Seed: ${config.mockDataSeed}`);
  } else {
    console.log(`  Database Host: ${config.database.host}`);
    console.log(`  Database Port: ${config.database.port}`);
    console.log(`  Database Name: ${config.database.database}`);
    console.log(`  Database User: ${config.database.username}`);
    console.log(`  Database Password: ${config.database.password ? '***hidden***' : 'not set'}`);
    if (config.database.ssl !== undefined) {
      console.log(`  SSL Enabled: ${config.database.ssl}`);
    }
  }
  
  console.log('═══════════════════════════════════════════════\n');
}