import fs from 'fs/promises';

import Chat from '../models/Chat.js';
import Document from '../models/Document.js';
import { processDocument } from '../services/documentService.js';

const removeTemporaryFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Unable to remove temporary upload:', error.message);
    }
  }
};

const processWithTimeout = (options, timeoutMs = 120000) =>
  Promise.race([
    processDocument(options),
    new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Document processing timed out')),
        timeoutMs
      );
    })
  ]);

// POST /api/documents/upload
// Used by the frontend chat composer to upload one PDF for the active chat.
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Please upload a PDF'
      });
    }

    let chat = null;

    if (req.body.chatId) {
      chat = await Chat.findOne({
        _id: req.body.chatId,
        userId: req.userId
      });

      if (!chat) {
        return res.status(404).json({
          message: 'Chat not found'
        });
      }

      if ((chat.documentIds || []).length > 0) {
        return res.status(409).json({
          message: 'This chat already has a document. Start a new chat to upload another file.'
        });
      }

    } else {
      chat = await Chat.create({
        userId: req.userId,
        title: req.file.originalname.slice(0, 50),
        documentIds: [],
        messages: []
      });
    }

    const file = req.file;
    const document = await Document.create({
      userId: req.userId,
      chatId: chat._id,
      name: file.originalname,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      status: 'processing'
    });

    try {
      const result = await processWithTimeout({
        documentId: document._id,
        userId: req.userId,
        filePath: file.path,
        fileName: document.name
      });

      document.pages = result.pages;
      document.status = 'ready';
      await document.save();
    } catch (error) {
      document.status = 'failed';
      await document.save();
      await removeTemporaryFile(file.path);

      console.error(
        `Document processing failed for ${file.originalname}:`,
        error.message
      );

      return res.status(422).json({
        message:
          error.message === 'Document processing timed out'
            ? 'Document processing took too long. Please try uploading it again.'
            : 'Unable to read or index this document.'
      });
    }

    // The indexed chunks are stored in Pinecone, so the original PDF is no
    // longer needed after processing and should not consume disk space.
    await removeTemporaryFile(file.path);

    chat.documentIds = [document._id];
    await chat.save();

    return res.status(201).json({
      message: 'Document uploaded successfully',
      document,
      chatId: chat._id,
      chat: {
        id: chat._id,
        title: chat.title
      }
    });
  } catch (error) {
    console.error('Upload error:', error.message);

    return res.status(500).json({
      message: 'Unable to upload documents'
    });
  }
};

// GET /api/documents?chatId=:chatId
// Used by frontend Home.jsx to load all documents belonging to a chat.
const getDocuments = async (req, res) => {
  try {
    if (!req.query.chatId) {
      return res.json([]);
    }

    const documents = await Document.find({
      userId: req.userId,
      chatId: req.query.chatId
    }).sort({
      createdAt: -1
    });

    return res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error.message);

    return res.status(500).json({
      message: 'Unable to fetch documents'
    });
  }
};

export {
  uploadDocument,
  getDocuments
};