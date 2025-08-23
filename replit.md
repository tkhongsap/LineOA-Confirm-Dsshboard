# Delivery Confirmation Dashboard

## Overview

This is a full-stack web application for tracking and managing delivery confirmations through messaging. The system provides a comprehensive dashboard for monitoring message delivery status, response rates, and customer communications. Built with React frontend and Express backend, it features real-time metrics, interactive charts, and message history management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: Shadcn/UI components built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack React Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Recharts library for data visualization (line charts, pie charts)
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database Integration**: Drizzle ORM configured for PostgreSQL
- **API Design**: RESTful endpoints for dashboard metrics, chart data, and message management
- **Storage Pattern**: Repository pattern with in-memory storage implementation (MemStorage class)
- **Middleware**: Custom logging middleware for API request tracking

### Database Schema
- **customers**: Stores customer information (id, name, phone)
- **messages**: Tracks individual messages with delivery status and response times
- **daily_stats**: Aggregated daily statistics for dashboard metrics
- **Message Types**: 'sent' | 'received'
- **Status Types**: 'pending' | 'confirmed' | 'not-confirmed' | 'question' | 'other'

### Data Flow
- Dashboard displays real-time metrics from aggregated daily statistics
- Message history with filtering and pagination support
- Chart data generation for trend analysis and category breakdowns
- CSV export functionality for message data

### Development Setup
- **Build System**: Vite for frontend development with hot module replacement
- **Database Migrations**: Drizzle Kit for schema management
- **Environment**: Development and production configurations with proper error handling
- **TypeScript**: Strict type checking across shared schemas and API interfaces

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database queries and migrations

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Shadcn/UI**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography

### Charts and Visualization
- **Recharts**: React charting library for dashboard analytics
- **Date-fns**: Date manipulation and formatting utilities

### Development Tools
- **Vite**: Fast build tool with development server
- **ESBuild**: Fast JavaScript bundler for production builds
- **TanStack React Query**: Data fetching and caching solution
- **Zod**: Runtime type validation and schema validation
- **React Hook Form**: Form state management and validation

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions