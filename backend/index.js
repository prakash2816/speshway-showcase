// backend/index.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import dynamoClient from './config/dynamodb.js';
import { ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Needed for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// -----------------------------
// MIDDLEWARE
// -----------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

app.use(cors(corsOptions));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -----------------------------
// ROUTES
// -----------------------------
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/contact', (await import('./routes/contact.js')).default);
app.use('/api/services', (await import('./routes/services.js')).default);
app.use('/api/portfolios', (await import('./routes/portfolios.js')).default);
app.use('/api/team', (await import('./routes/team.js')).default);
app.use('/api/gallery', (await import('./routes/gallery.js')).default);
app.use('/api/clients', (await import('./routes/clients.js')).default);
app.use('/api/Sentences', (await import('./routes/Sentences.js')).default);

// -----------------------------
// ROOT HEALTH CHECK
// -----------------------------
app.get('/', (req, res) => {
  res.json({
    message: 'API is running...',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// -----------------------------
// DYNAMODB HEALTH CHECK
// -----------------------------
app.get('/api/health', async (req, res) => {
  try {
    await dynamoClient.send(new ListTablesCommand({}));
    res.json({
      status: 'ok',
      message: 'Backend & DynamoDB healthy ✔️',
      timestamp: new Date().toISOString(),
      dynamodb: 'connected',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'DynamoDB connection failed ❌',
      error: err.message,
    });
  }
});

// -----------------------------
// GLOBAL ERROR HANDLER
// -----------------------------
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Max 5MB',
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message,
  });
});

// -----------------------------
// EXPORT FOR SERVERLESS
// -----------------------------
export default app;

// -----------------------------
// NOTE:
// Remove app.listen() because Lambda will handle requests via handler.mjs
// -----------------------------
