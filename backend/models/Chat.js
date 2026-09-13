import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },

    fileName: {
      type: String
    },

    pageNumber: {
      type: Number
    },

    text: {
      type: String
    }
  },
  {
    _id: false
  }
);

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },

  content: {
    type: String,
    required: true
  },

  sources: {
    type: [sourceSchema],
    default: []
  },

  suggestions: {
    type: [String],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    title: {
      type: String,
      default: 'New Chat',
      trim: true
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },

    messages: {
      type: [messageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;