import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Routes
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import adminRoutes from './routes/admin.routes';
import loanRoutes from './routes/loan.routes';
import orderRoutes from './routes/order.routes';

// Middleware
import { errorHandler } from './middleware/error-handler';

/**
 * AVENIR Banking - Express Parallel Implementation
 * 
 * This is a parallel implementation of the banking API using Express framework
 * to satisfy the technical constraint: "2 frameworks backend (Nest.js, Express, Fastify, etc)"
 * 
 * Architecture:
 * - Uses the same Domain layer (aggregates, value objects, entities)
 * - Uses the same Infrastructure layer (Prisma, Event Store)
 * - Different Interface layer (Express controllers instead of NestJS)
 * 
 * This demonstrates Clean Architecture independence from frameworks.
 * 
 * Port: 3001 (NestJS runs on 3000)
 */

const PORT = process.env.EXPRESS_PORT || 3001;

// Initialize Express app
const app: Application = express();

// Initialize Prisma client with Postgres adapter
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ 
  adapter,
  log: ['error', 'warn'],
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS
app.use(compression()); // Response compression
app.use(morgan('combined')); // Request logging
app.use(express.json()); // JSON body parser
app.use(express.urlencoded({ extended: true })); // URL-encoded body parser

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    framework: 'Express',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/orders', orderRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    framework: 'Express',
  });
});

// Global error handler
app.use(errorHandler);

// Start server
async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║   AVENIR Banking - Express Implementation                 ║');
      console.log('║   Framework: Express.js (Parallel to NestJS)              ║');
      console.log('║   Clean Architecture: Same Domain & Infrastructure        ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log(`🚀 Express server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
      console.log('');
      console.log('Available Endpoints:');
      console.log('  POST   /api/auth/register     - User registration');
      console.log('  POST   /api/auth/login        - User login');
      console.log('  GET    /api/accounts          - List accounts');
      console.log('  POST   /api/accounts/open     - Open new account');
      console.log('  POST   /api/accounts/transfer - Transfer funds');
      console.log('  GET    /api/admin/securities  - List securities');
      console.log('  POST   /api/loans/grant       - Grant loan');
      console.log('  POST   /api/orders/place      - Place order');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start Express server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down Express server...');
  await prisma.$disconnect();
  console.log('✅ Express server stopped');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down Express server...');
  await prisma.$disconnect();
  console.log('✅ Express server stopped');
  process.exit(0);
});

bootstrap();

export default app;
