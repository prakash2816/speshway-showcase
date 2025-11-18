const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const dynamoClient = require('./config/dynamodb');

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================
// API ROUTES (DynamoDB-based)
// ============================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/services', require('./routes/services'));
app.use('/api/portfolios', require('./routes/portfolios'));
app.use('/api/team', require('./routes/team'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/sentences', require('./routes/sentences'));

// ============================
// ROOT API HEALTH
// ============================
app.get('/', (req, res) => {
  res.json({
    message: 'API is running...',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ============================
// DYNAMODB HEALTH CHECK
// ============================
const { ListTablesCommand } = require("@aws-sdk/client-dynamodb");

app.get('/api/health', async (req, res) => {
  try {
    await dynamoClient.send(new ListTablesCommand({}));

    res.json({
      status: 'ok',
      message: 'Backend & DynamoDB healthy ✔️',
      timestamp: new Date().toISOString(),
      dynamodb: 'connected'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'DynamoDB connection failed ❌',
      error: err.message
    });
  }
});

// ============================
// GLOBAL ERROR HANDLER
// ============================
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Max 5MB'
      });
    }
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// ============================
// START SERVER
// ============================
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
