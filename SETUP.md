# Three-Mode Setup Guide

## Overview

This application supports three operational modes to facilitate development, testing, and production deployment:

- **MOCKUP Mode**: Uses deterministic mock data for demos and UI/UX validation
- **DEV Mode**: Connects to a development PostgreSQL database for integration testing
- **PROD Mode**: Connects to the production PostgreSQL database with real data

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Choose your mode and copy the appropriate template:

```bash
# For Mockup Mode (default, no database required)
cp .env.example.mockup .env

# For Development Mode
cp .env.example.dev .env

# For Production Mode
cp .env.example.prod .env
```

Then edit `.env` with your specific configuration.

### 3. Run the Application

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build
npm run start
```

## Mode-Specific Setup

### MOCKUP Mode (Default)

Perfect for:
- UI/UX development and testing
- Demos and presentations
- Frontend development without backend dependencies

Configuration:
```env
MODE=MOCKUP
MOCK_DATA_SEED=12345  # Use same seed for consistent data
RETENTION_DAYS=30
```

Features:
- Deterministic data generation (same seed = same data)
- No database required
- 30 days of realistic mock history
- All dashboard features functional

### DEV Mode

Perfect for:
- Integration testing
- Backend development
- Database schema validation

Prerequisites:
1. PostgreSQL database running
2. Database created: `CREATE DATABASE delivery_dev;`
3. Run migrations: `npm run db:push`

Configuration:
```env
MODE=DEV
DEV_DB_HOST=localhost
DEV_DB_PORT=5432
DEV_DB_NAME=delivery_dev
DEV_DB_USER=dev_user
DEV_DB_PASSWORD=dev_password
```

### PROD Mode

Perfect for:
- Production deployment
- Live customer data
- Real-time metrics

Prerequisites:
1. Production PostgreSQL database
2. Proper security measures (SSL, secrets management)
3. Database migrations applied

Configuration:
```env
MODE=PROD
PROD_DB_HOST=your-prod-database.com
PROD_DB_PORT=5432
PROD_DB_NAME=delivery_prod
PROD_DB_USER=prod_user
PROD_DB_PASSWORD=<from-secrets-manager>
```

## Database Setup (DEV/PROD)

### 1. Create Database

```sql
-- For Development
CREATE DATABASE delivery_dev;

-- For Production
CREATE DATABASE delivery_prod;
```

### 2. Run Migrations

```bash
# Apply schema changes
npm run db:push
```

### 3. Verify Schema

The application uses these tables:
- `customers`: Customer information
- `batches`: Message batch records
- `daily_stats`: Aggregated daily metrics
- `system_config`: System configuration

## API Endpoints

All modes expose the same API endpoints:

- `GET /api/dashboard/metrics` - Current dashboard metrics
- `GET /api/dashboard/chart-data?days=7` - Historical chart data
- `GET /api/dashboard/category-data` - Response category breakdown
- `GET /api/batches` - Batch history with filtering
- `GET /api/batches/:id` - Single batch details
- `GET /api/batches/:id/export` - Export batch as CSV

## Environment Variables

### Required
- `MODE`: Operation mode (MOCKUP | DEV | PROD)

### Optional
- `PORT`: Server port (default: 5000)
- `RETENTION_DAYS`: Data retention period (default: 30)
- `LOG_LEVEL`: Logging level (debug | info | warn | error)

### Mode-Specific

**MOCKUP Mode:**
- `MOCK_DATA_SEED`: Seed for random data generation

**DEV Mode:**
- `DEV_DB_HOST`: Database host
- `DEV_DB_PORT`: Database port
- `DEV_DB_NAME`: Database name
- `DEV_DB_USER`: Database user
- `DEV_DB_PASSWORD`: Database password

**PROD Mode:**
- `PROD_DB_HOST`: Database host
- `PROD_DB_PORT`: Database port
- `PROD_DB_NAME`: Database name
- `PROD_DB_USER`: Database user
- `PROD_DB_PASSWORD`: Database password

## Development Workflow

### 1. Start with MOCKUP Mode
- Develop and test UI components
- Validate user flows
- Get stakeholder approval

### 2. Move to DEV Mode
- Test database operations
- Validate API endpoints
- Ensure data integrity

### 3. Deploy to PROD Mode
- Use proper secrets management
- Enable monitoring and logging
- Set up backup procedures

## Troubleshooting

### Mode Not Switching
- Ensure MODE environment variable is set correctly
- Check for typos (MOCKUP, DEV, PROD are case-sensitive)
- Restart the server after changing .env

### Database Connection Failed (DEV/PROD)
- Verify database is running
- Check connection credentials
- Ensure network access to database
- Verify database exists and migrations are applied

### Mock Data Not Consistent
- Use the same MOCK_DATA_SEED value across instances
- Clear browser cache if data seems stale

## Security Considerations

### Production Deployment
- Never commit .env files with real credentials
- Use secrets management services (AWS Secrets Manager, Azure Key Vault, etc.)
- Enable SSL/TLS for database connections
- Implement proper authentication and authorization
- Set up rate limiting and monitoring
- Regular security audits and updates

### Data Retention
- Default retention is 30 days
- Adjust RETENTION_DAYS based on compliance requirements
- Implement automated cleanup jobs for old data

## Support

For issues or questions:
1. Check the logs (debug mode provides detailed information)
2. Verify environment configuration
3. Ensure all dependencies are installed
4. Check database connectivity (for DEV/PROD modes)