# API Gateway Integration Guide

## Overview

The API Gateway acts as a single entry point for all microservices and handles authentication forwarding to downstream services.

## Architecture

```
Client (Flutter)
    ↓
API Gateway (Port 8000)
    ↓
    ├── Authentication Service (Port 8001)
    ├── Expense Service (Port 8002)
    ├── Payment Service (Port 8003)
    ├── Notification Service (Port 8004)
    ├── Reporting Service (Port 8005)
    ├── OCR Service (Port 8006)
    └── Support Service (Port 8007)
```

## Authentication Flow

### 1. Login Flow

```javascript
// Client sends credentials
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceId": "device-uuid-here"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "uuid-here",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "isverified": true
  }
}
```

### 2. Access Protected Resources

```javascript
// Client includes access token in Authorization header
GET /api/expenses
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// API Gateway forwards the Authorization header to downstream services
```

### 3. Refresh Token Flow

```javascript
// When access token expires (after 15 minutes)
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Response
{
  "success": true,
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

### 4. Logout Flow

```javascript
// Logout current device
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Logout all devices
POST /auth/logout-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Gateway Implementation (Express.js Example)

```javascript
// gateway/server.js
import express from 'express';
import httpProxy from 'http-proxy';
import jwt from 'jsonwebtoken';

const app = express();
const proxy = httpProxy.createProxyServer();

// Service registry (in production, use Eureka or Consul)
const services = {
  'auth': 'http://localhost:8001',
  'expense': 'http://localhost:8002',
  'payment': 'http://localhost:8003',
  'notification': 'http://localhost:8004',
  'reporting': 'http://localhost:8005',
  'ocr': 'http://localhost:8006',
  'support': 'http://localhost:8007',
};

// JWT verification (optional - can be done at auth service only)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

// Main proxy middleware
app.use('/api', async (req, res) => {
  // Extract service from path
  const pathParts = req.path.split('/');
  const serviceName = pathParts[2]; // /api/{service}/...

  if (!serviceName || !services[serviceName]) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  // Forward Authorization header to downstream services
  const authHeader = req.headers.authorization;
  if (authHeader) {
    req.headers['authorization'] = authHeader;
  }

  // Add gateway metadata
  req.headers['x-gateway-request-id'] = req.id;
  req.headers['x-forwarded-for'] = req.ip;
  req.headers['x-user-agent'] = req.headers['user-agent'];

  // Proxy to service
  proxy.web(req, res, {
    target: services[serviceName],
    changeOrigin: true,
    selfHandleResponse: false,
  }, (e) => {
    console.error('Proxy error:', e);
    res.status(500).json({
      success: false,
      message: 'Service unavailable'
    });
  });
});

// Auth routes (direct to auth service, no token required)
app.use('/auth', (req, res) => {
  proxy.web(req, res, {
    target: services['auth'],
    changeOrigin: true,
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.GATEWAY_PORT || 8000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
```

## Alternative: Nginx Configuration

```nginx
# /etc/nginx/conf.d/gateway.conf

upstream auth_service {
    server localhost:8001;
}

upstream expense_service {
    server localhost:8002;
}

upstream payment_service {
    server localhost:8003;
}

server {
    listen 80;
    server_name api.yourapp.com;

    # Auth routes (no auth required)
    location /auth/ {
        proxy_pass http://auth_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Protected API routes
    location /api/ {
        # Forward Authorization header
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Device-ID $http_x_device_id;

        # Route to appropriate service
        if ($request_uri ~* "^/api/expense") {
            proxy_pass http://expense_service;
        }
        
        if ($request_uri ~* "^/api/payment") {
            proxy_pass http://payment_service;
        }
    }

    # Health check
    location /health {
        return 200 '{"status":"ok"}';
        add_header Content-Type application/json;
    }
}
```

## Alternative: AWS API Gateway

```yaml
# AWS API Gateway + Lambda Authorizer

# 1. Create Lambda Authorizer
import jwt

def lambda_handler(event, context):
    token = event['authorizationToken'].replace('Bearer ', '')
    
    try:
        # Verify access token
        decoded = jwt.decode(
            token,
            'JWT_ACCESS_SECRET',
            algorithms=['HS256']
        )
        
        # Generate policy
        policy = generate_policy(decoded['user_id'], 'Allow', event['methodArn'])
        
        return {
            'principalId': decoded['user_id'],
            'policyDocument': policy,
            'context': {
                'user_id': decoded['user_id']
            }
        }
    except jwt.ExpiredSignatureError:
        raise Exception('Unauthorized')
    except jwt.InvalidTokenError:
        raise Exception('Unauthorized')

def generate_policy(principal_id, effect, resource):
    return {
        'Version': '2012-10-17',
        'Statement': [{
            'Action': 'execute-api:Invoke',
            'Effect': effect,
            'Resource': resource
        }]
    }

# 2. Configure API Gateway
# - Add Lambda Authorizer to protected routes
# - Forward Authorization header to backend
# - Map user_id from context to request headers
```

## Security Best Practices

### 1. Always Forward Authorization Header

```javascript
// ✅ CORRECT - Forward Authorization header
app.use('/api', (req, res, next) => {
  if (req.headers.authorization) {
    req.headers['authorization'] = req.headers.authorization;
  }
  next();
});

// ❌ WRONG - Strip Authorization header
app.use('/api', (req, res, next) => {
  delete req.headers.authorization; // Don't do this!
  next();
});
```

### 2. Add Request ID for Tracing

```javascript
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

### 3. Rate Limiting at Gateway

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests'
  }
});

app.use('/api', limiter);
```

### 4. CORS Configuration

```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID']
}));
```

## Microservice Integration

### Expense Service Example

```javascript
// expense-service/app.js
import express from 'express';
import { authenticate } from 'auth-service/middlewares/authMiddleware.js';

const app = express();

// Protected route - uses authenticate middleware
app.get('/api/expense/transactions', authenticate, (req, res) => {
  // req.user.user_id is available here
  const userId = req.user.user_id;
  
  // Fetch transactions for user
  const transactions = await getTransactions(userId);
  
  res.json({
    success: true,
    data: transactions
  });
});

// Another protected route
app.post('/api/expense/create', authenticate, async (req, res) => {
  const userId = req.user.user_id;
  
  // Create expense for authenticated user
  // NEVER trust user_id from request body!
  const expense = await createExpense({
    ...req.body,
    user_id: userId // Always use req.user.user_id
  });
  
  res.json({
    success: true,
    data: expense
  });
});
```

### Payment Service Example

```javascript
// payment-service/app.js
import express from 'express';
import { authenticate } from 'auth-service/middlewares/authMiddleware.js';

const app = express();

app.post('/api/payment/initiate', authenticate, async (req, res) => {
  const userId = req.user.user_id;
  
  // Validate payment request
  const { amount, currency } = req.body;
  
  // Create payment
  const payment = await createPayment({
    user_id: userId, // From JWT, not from client
    amount,
    currency
  });
  
  res.json({
    success: true,
    data: payment
  });
});
```

## Flutter Integration

### API Client Setup

```dart
// lib/services/api_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const _storage = FlutterSecureStorage();
  static const _baseUrl = 'https://api.yourapp.com';
  
  late final Dio _dio;
  
  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: 30000,
      receiveTimeout: 30000,
    ));
    
    // Add interceptor for automatic token refresh
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'accessToken');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Try to refresh token
          final refreshToken = await _storage.read(key: 'refreshToken');
          if (refreshToken != null) {
            try {
              final newTokens = await _refreshToken(refreshToken);
              await _storage.write(key: 'accessToken', value: newTokens['accessToken']);
              await _storage.write(key: 'refreshToken', value: newTokens['refreshToken']);
              
              // Retry original request
              final requestOptions = error.requestOptions;
              requestOptions.headers['Authorization'] = 'Bearer ${newTokens['accessToken']}';
              return handler.resolve(await _dio.fetch(requestOptions));
            } catch (e) {
              // Refresh failed, clear storage and redirect to login
              await _clearStorage();
              // Navigate to login screen
              return handler.reject(error);
            }
          }
        }
        return handler.next(error);
      },
    ));
  }
  
  Future<Map<String, dynamic>> _refreshToken(String refreshToken) async {
    final response = await _dio.post('/auth/refresh', data: {
      'refreshToken': refreshToken,
    });
    return response.data;
  }
  
  Future<void> _clearStorage() async {
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'refreshToken');
    await _storage.delete(key: 'userData');
  }
  
  // API methods
  Future<dynamic> get(String path) => _dio.get('/api$path');
  Future<dynamic> post(String path, dynamic data) => _dio.post('/api$path', data: data);
  Future<dynamic> put(String path, dynamic data) => _dio.put('/api$path', data: data);
  Future<dynamic> delete(String path) => _dio.delete('/api$path');
}
```

### Usage in Flutter

```dart
// lib/screens/login_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _storage = FlutterSecureStorage();
  final _apiClient = ApiClient();
  
  Future<void> _login(String email, String password) async {
    try {
      final response = await _apiClient.post('/auth/login', {
        'email': email,
        'password': password,
      });
      
      // Store tokens securely
      await _storage.write(key: 'accessToken', value: response['accessToken']);
      await _storage.write(key: 'refreshToken', value: response['refreshToken']);
      await _storage.write(key: 'userData', value: jsonEncode(response['user']));
      
      // Navigate to home
      Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      // Show error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Login failed: $e'))
      );
    }
  }
  
  Future<void> _logout() async {
    try {
      final refreshToken = await _storage.read(key: 'refreshToken');
      if (refreshToken != null) {
        await _apiClient.post('/auth/logout', {
          'refreshToken': refreshToken,
        });
      }
    } catch (e) {
      // Ignore errors on logout
    } finally {
      await _clearStorage();
      Navigator.pushReplacementNamed(context, '/login');
    }
  }
  
  Future<void> _clearStorage() async {
    await _storage.deleteAll();
  }
}
```

## Testing

### Test Authentication Flow

```bash
# 1. Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "deviceId": "test-device"
  }'

# Response
{
  "success": true,
  "accessToken": "...",
  "refreshToken": "..."
}

# 2. Access protected resource
curl http://localhost:8000/api/expense/transactions \
  -H "Authorization: Bearer <accessToken>"

# 3. Refresh token
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'

# 4. Logout
curl -X POST http://localhost:8000/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'

# 5. Logout all devices
curl -X POST http://localhost:8000/auth/logout-all \
  -H "Authorization: Bearer <accessToken>"
```

## Monitoring and Logging

### Add Request Logging

```javascript
import morgan from 'morgan';

// Log all requests
app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));

// Log authentication events
app.use('/auth', (req, res, next) => {
  console.log({
    timestamp: new Date().toISOString(),
    event: 'auth_request',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  next();
});
```

### Add Metrics

```javascript
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

## Deployment

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api-gateway:
    build: ./gateway
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
    depends_on:
      - auth-service
      - expense-service
      - payment-service
    networks:
      - microservices

  auth-service:
    build: ./auth-service
    ports:
      - "8001:8001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - microservices

  expense-service:
    build: ./expense-service
    ports:
      - "8002:8002"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    networks:
      - microservices

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - microservices

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - microservices

volumes:
  postgres-data:
  redis-data:

networks:
  microservices:
    driver: bridge
```

## Summary

The API Gateway:
1. ✅ Forwards `Authorization: Bearer <token>` to all downstream services
2. ✅ Routes requests to appropriate microservices
3. ✅ Handles CORS, rate limiting, and logging
4. ✅ Provides a single entry point for clients
5. ✅ Can implement additional security (IP whitelisting, DDoS protection)

All microservices use the same `authenticate` middleware to extract `req.user.user_id` from the JWT token.