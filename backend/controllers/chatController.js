import Chat from '../models/Chat.js';
import gemini from '../config/gemini.js';

import {
  prepareRagContext,
  generateSuggestions
} from '../services/ragService.js';

const isCasualQuestion = (question) =>
  /^(hi+|hello+|hey+|good morning|good afternoon|good evening|how are you|thanks?|thank you|what's up|whats up)[!?.\s]*$/i.test(
    question
  );

const askQuestion = async (req, res) => {
  let chat = null;

  try {
    const { question, documentId, chatId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        message: 'Question is required'
      });
    }

    if (chatId) {
      chat = await Chat.findOne({
        _id: chatId,
        userId: req.userId
      });
    }

    // Create a new chat when the frontend does not send a valid chat id
    if (!chat) {
      chat = await Chat.create({
        userId: req.userId,
        title: question.trim().slice(0, 50),
        documentId,
        messages: []
      });
    }

    const chatDocumentId = chat.documentId;

    // if it is a new question
    if (chat.messages.length === 0) {
      chat.title = question.trim().slice(0, 50);
    }

    chat.messages.push({
      role: 'user',
      content: question.trim()
    });

    // Persist the title and user message before retrieval so failed generation
    // cannot leave an empty "New Chat" record in the database.
    await chat.save();

    // array of objects
    const history = chat.messages.map((message) => ({
      role: message.role,
      content: message.content
    }));

    const casualQuestion = isCasualQuestion(question.trim());

    // Casual conversation should not retrieve or cite document chunks.
    const { context, sources } = casualQuestion
      ? { context: 'CASUAL_CONVERSATION', sources: [] }
      : await prepareRagContext({
          question: question.trim(),
          history: history.slice(0, -1),
          documentId: chatDocumentId,
          userId: req.userId
        });

    res.setHeader(
      'Content-Type',
      'text/event-stream'
    );

    res.setHeader(
      'Cache-Control',
      'no-cache'
    );

    res.setHeader(
      'Connection',
      'keep-alive'
    );

    res.flushHeaders?.();

    // Tell the frontend which chat is currently being used
    res.write(
      `data: ${JSON.stringify({
        type: 'start',
        chatId: chat._id,
        title: chat.title
      })}\n\n`
    );

    if (!context) {
      const answer =
        "I couldn't find enough relevant information in the selected documents.";

      chat.messages.push({
        role: 'assistant',
        content: answer,
        sources: [],
        suggestions: []
      });

      await chat.save();

      res.write(
        `data: ${JSON.stringify({
          type: 'token',
          content: answer
        })}\n\n`
      );

      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          sources: [],
          suggestions: []
        })}\n\n`
      );

      return res.end();
    }

    const prompt = casualQuestion
      ? `
You are a friendly document assistant.

Reply briefly and naturally to the user's casual message.
Do not mention documents, sources, retrieval, or context.

User message:
${question}
`
      : `
You are a document question-answering assistant.

Answer the user's question using only the provided document context.

Rules:
- Do not invent information.
- If the context does not contain the answer, say so.
- Give a clear and concise answer.
- For broad questions about what the document is about, summarize its subject,
  purpose, main topics, and the most important information found in the context.
- Use Markdown when helpful.
- Do not create fake citations.

Context:
${context}

Question:
${question}
`;

    // Stream Gemini output directly to the frontend
    const stream = await gemini.models.generateContentStream({
      model:
        process.env.GEMINI_MODEL ||
        'gemini-2.5-flash',
      contents: prompt
    });

    let fullAnswer = '';

    for await (const chunk of stream) {
      const text = chunk.text || '';

      if (!text) {
        continue;
      }

      fullAnswer += text;

      res.write(
        `data: ${JSON.stringify({
          type: 'token',
          content: text
        })}\n\n`
      );
    }

    if (!fullAnswer.trim()) {
      fullAnswer = casualQuestion
        ? 'Hello! How can I help you today?'
        : "I couldn't find a reliable answer in the selected document.";
      sources.length = 0;

      res.write(
        `data: ${JSON.stringify({
          type: 'token',
          content: fullAnswer
        })}\n\n`
      );
    }

    const suggestions = casualQuestion
      ? []
      : await generateSuggestions(question, fullAnswer);

    // Store the complete streamed response after generation finishes
    chat.messages.push({
      role: 'assistant',
      content: fullAnswer,
      sources,
      suggestions
    });

    await chat.save();

    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        sources,
        suggestions
      })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error(
      'Chat error:',
      error.message
    );

    if (res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: 'Unable to generate response'
        })}\n\n`
      );

      return res.end();
    }

    return res.status(500).json({
      message: 'Unable to generate response',
      chatId: chat?._id,
      title: chat?.title
    });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      userId: req.userId
    })
      .select('title documentId messages createdAt updatedAt')
      .sort({
        updatedAt: -1  // Sort the chats by updatedAt, with the most recently updated chat first
      });

    const normalizedChats = await Promise.all(
      chats.map(async (chat) => {
        const firstUserMessage = chat.messages.find(
          (message) => message.role === 'user'
        );

        if (
          firstUserMessage &&
          (!chat.title || chat.title === 'New Chat')
        ) {
          chat.title = firstUserMessage.content.slice(0, 50);
          await chat.save();
        }

        return {
          _id: chat._id,
          title: chat.title,
          documentId: chat.documentId,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        };
      })
    );

    return res.json(normalizedChats);
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to fetch chats'
    });
  }
};

const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    return res.json(chat);
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to fetch chat'
    });
  }
};

const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    return res.json({
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to delete chat'
    });
  }
};

const renameChat = async (req, res) => {
  try {
    const title = req.body.title?.trim();

    if (!title) {
      return res.status(400).json({
        message: 'Chat name is required'
      });
    }

    const chat = await Chat.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId
      },
      { title: title.slice(0, 50) },
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({
        message: 'Chat not found'
      });
    }

    return res.json({
      message: 'Chat renamed successfully',
      chat
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to rename chat'
    });
  }
};

export {
  askQuestion,
  getChats,
  getChat,
  deleteChat,
  renameChat
};