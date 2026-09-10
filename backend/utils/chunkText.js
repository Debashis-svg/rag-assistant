import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const chunkText = async (documents) => {
  // Split documents while keeping metadata such as page and file name
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50
  });

  return await splitter.splitDocuments(documents);
};

export default chunkText;