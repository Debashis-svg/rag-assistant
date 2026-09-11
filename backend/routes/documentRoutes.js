import express from 'express';
import multer from 'multer';
import path from 'path';

import authMiddleware from '../middleware/authMiddleware.js';

import {
  uploadDocument,
  getDocuments
} from '../controllers/documentController.js';

const router = express.Router();
const uploadsDirectory = path.resolve('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDirectory);
  },

  filename: (req, file, cb) => {
    // Use a unique filename to avoid overwriting files with the same name
    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDF files only
  if (
    file.mimetype === 'application/pdf' ||
    path.extname(file.originalname).toLowerCase() === '.pdf'
  ) {
    return cb(null, true);
  }

  cb(new Error('Only PDF files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

// All document routes require authentication
router.use(authMiddleware);

router.get('/', getDocuments);

router.post(
  '/upload',
  upload.single('document'),
  uploadDocument
);

export default router;