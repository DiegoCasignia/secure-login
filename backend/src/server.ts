import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import { testConnection, closeConnection } from './config/database';
import routes from './presentation/routes';
import { globalRateLimiter } from './presentation/middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './presentation/middlewares/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.env === 'production' 
    ? ['https://yourapp.com'] 
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
}));

// Rate limiting
app.use(globalRateLimiter);

// Logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  console.log('Shutting down gracefully...');
  
  try {
    await closeConnection();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await testConnection();

    // Load face API models
    //await faceApiService.loadModels();

    app.listen(config.port, () => {
      console.log(`
Server is running!
Port: ${config.port}
Environment: ${config.env}
API Version: ${config.apiVersion}
Time: ${new Date().toLocaleString()}
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;