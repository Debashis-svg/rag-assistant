import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    originalName: {
      type: String,
      required: true
    },

    path: {
      type: String,
      required: true
    },

    size: {
      type: Number,
      default: 0
    },

    pages: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'processing'
    }
  },
  {
    timestamps: true
  }
);

const Document = mongoose.model('Document', documentSchema);

export default Document;