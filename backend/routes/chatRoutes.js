import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import {
  askQuestion,
  getChats,
  getChat,
  deleteChat,
  renameChat
} from '../controllers/chatController.js';

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

router.post('/', askQuestion);

router.get('/', getChats);

router.get('/:id', getChat);

router.put('/:id', renameChat);

router.delete('/:id', deleteChat);

export default router;