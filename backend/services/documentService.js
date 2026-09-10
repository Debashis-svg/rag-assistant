import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document as LangchainDocument } from '@langchain/core/documents';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { PineconeStore } from '@langchain/pinecone';

import { pineconeIndex } from '../config/pinecone.js';
import chunkText from '../utils/chunkText.js';
import extractTables from '../utils/extractTable.js';
import extractWithOCR from './ocrService.js';

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'
});

const processDocument = async ({
  documentId,
  userId,
  filePath,
  fileName
}) => {
  // Step 1: Extract text page-by-page from the PDF
  const loader = new PDFLoader(filePath, {
    splitPages: true
  });

  let pages = await loader.load();

  const extractedText = pages
    .map((page) => page.pageContent)
    .join('')
    .trim();

  // Step 2: Use OCR only when normal PDF extraction gives almost no text
  if (extractedText.length < 50) {
    const ocrText = await extractWithOCR(filePath);

    if (!ocrText.trim()) {
      throw new Error('Unable to extract text from document');
    }

    pages = [
      new LangchainDocument({
        pageContent: ocrText,
        metadata: {
          pageNumber: 1
        }
      })
    ];
  }

  const preparedDocuments = [];

  // Step 3: Attach document metadata needed for filtering and citations
  pages.forEach((page, index) => {
    const pageNumber =
      page.metadata?.loc?.pageNumber ||
      page.metadata?.pageNumber ||
      index + 1;

    const text = page.pageContent?.trim();

    if (text) {
      preparedDocuments.push(
        new LangchainDocument({
          pageContent: text,
          metadata: {
            userId: userId.toString(),
            documentId: documentId.toString(),
            fileName,
            pageNumber,
            type: 'text'
          }
        })
      );

      // Preserve table-like data as separate searchable chunks
      const tables = extractTables(text);

      tables.forEach((table) => {
        preparedDocuments.push(
          new LangchainDocument({
            pageContent: table,
            metadata: {
              userId: userId.toString(),
              documentId: documentId.toString(),
              fileName,
              pageNumber,
              type: 'table'
            }
          })
        );
      });
    }
  });

  // Step 4: Split text into smaller overlapping chunks
  const chunks = await chunkText(preparedDocuments);

  if (chunks.length === 0) {
    throw new Error('No usable content found in document');
  }

  // Give every vector a chunk id for easier tracking
  const finalChunks = chunks.map((chunk, index) => {
    chunk.metadata.chunkId = index;
    return chunk;
  });

  // Step 5: Generate embeddings and store them in Pinecone
  await PineconeStore.fromDocuments(
    finalChunks,
    embeddings,
    {
      pineconeIndex
    }
  );

  return {
    pages: pages.length,
    chunks: finalChunks.length
  };
};

const deleteDocumentVectors = async (documentId, userId) => {
  // Delete only vectors belonging to this user's document
  await pineconeIndex.deleteMany({
    filter: {
      documentId: {
        $eq: documentId.toString()
      },
      userId: {
        $eq: userId.toString()
      }
    }
  });
};

const reindexDocument = async (data) => {
  // Remove old vectors before creating fresh embeddings
  await deleteDocumentVectors(
    data.documentId,
    data.userId
  );

  return processDocument(data);
};

export {
  processDocument,
  deleteDocumentVectors,
  reindexDocument
};