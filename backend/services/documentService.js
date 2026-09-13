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
  model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  outputDimensionality: 3072,
});

const hasUsefulText = (text) => {
  const normalized = text?.replace(/\s+/g, ' ').trim() || '';
  const meaningfulCharacters = (normalized.match(/[A-Za-z0-9]/g) || []).length;

  return meaningfulCharacters >= 80 && normalized.length >= 120;
};

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
 
  // extractedText will hold one big string containing the text from all PDF pages, with \n (newline) inserted between each page's text.
  const extractedText = pages
    .map((page) => page.pageContent || '')
    .join('\n')
    .trim();

  // Step 2: Use OCR when the PDF has no meaningful text layer, which is
  // common for scanned mark sheets and image-only documents.
  if (!hasUsefulText(extractedText)) {
    const ocrPages = await extractWithOCR(filePath, pages.length);

    if (!ocrPages.length) {
      throw new Error('Unable to extract text from document');
    }

    pages = ocrPages.map(
      (pageContent, index) =>
        // creating a LangChain Document object from some extracted text
        new LangchainDocument({
          pageContent,
          metadata: {
            pageNumber: index + 1
          }
        })
    );
  }

  const preparedDocuments = []; // array of pagaes with metadata for each page

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
      const tables = extractTables(text);  // extract tables from the current page(if any)

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
      pineconeIndex,
      maxConcurrency: 3
    }
  );

  return {
    pages: pages.length,
    chunks: finalChunks.length
  };
};

export {
  processDocument
};