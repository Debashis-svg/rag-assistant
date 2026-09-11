import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const cleanupOldUploads = async () => {
  const uploadsDirectory = path.resolve('uploads');

  try {
    const files = await fs.readdir(uploadsDirectory);

    await Promise.all(
      files.map((file) =>
        fs.unlink(path.join(uploadsDirectory, file)).catch((error) => {
          console.error(`Unable to remove old upload ${file}:`, error.message);
        })
      )
    );
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Unable to clean old uploads:', error.message);
    }
  }
};

await cleanupOldUploads();

const app = express();

// Connect MongoDB
connectDB();

// Allow requests from frontend
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
  })
);

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'QueryNest API is running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

// Handle multer or other server errors
app.use((error, req, res, next) => {
  console.error(error.message);

  return res.status(500).json({
    message: error.message || 'Something went wrong'
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});