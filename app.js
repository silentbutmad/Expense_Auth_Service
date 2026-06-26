import express from "express"
import authRoutes from './routes/authRoutes.js'
import 'dotenv/config'
import cors from 'cors'
import eureka from "./eurukaregister.js";
import { redis } from "./models/redis.js";
import { prisma } from "./models/db.js";

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));



// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // 1. Split and trim whitespace from origins
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(',')
      .map(o => o.trim().replace(/\/$/, "")); // Removes trailing slashes

    if (!origin) return callback(null, true);
    
    // Clean current incoming origin
    const cleanOrigin = origin.trim().replace(/\/$/, "");

    // 2. Check match
    if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // Log the exact mismatch in your Render terminal console
      console.error(`[CORS Blocked] Incoming: "${cleanOrigin}" | Allowed: ${JSON.stringify(allowedOrigins)}`);
      callback(new Error('CORS_NOT_ALLOWED'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID']
}));



// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check endpoints
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    res.json({ 
      status: "UP",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        redis: "connected"
      }
    });
  } catch (error) {
    res.status(503).json({
      status: "DOWN",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

app.get("/status", (req, res) => res.send("OK"));

// API routes
app.use('/auth', authRoutes);

// 404 handler
app.use( (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    code: "ROUTE_NOT_FOUND"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    code: err.code || "INTERNAL_ERROR"
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await prisma.$disconnect();
      await redis.quit();
      console.log('Database and Redis connections closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await prisma.$disconnect();
      await redis.quit();
      console.log('Database and Redis connections closed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`Auth Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Register with Eureka
eureka.start((error) => {
  if (error) {
    console.log("Eureka registration failed:", error);
  } else {
    console.log("AUTH-SERVICE registered with Eureka");
  }
});
