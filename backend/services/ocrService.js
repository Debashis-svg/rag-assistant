import fs from 'fs';
import gemini from '../config/gemini.js';

const extractWithOCR = async (filePath, pageCount = 1) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    // Gemini is used only when normal PDF text extraction fails
    const response = await gemini.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data
              }
            },
            {
              text: `
This may be a scanned PDF where the pages contain images instead of an
embedded text layer. Perform OCR on every page and extract all readable text.

Keep:
- headings
- paragraphs
- lists
- tables, including every row and column value
- labels and values shown beside each other

Separate pages with a line containing exactly: --- PAGE BREAK ---

Return only the extracted document content.
`
            }
          ]
        }
      ]
    });

    const text = response.text?.trim() || '';

    if (!text) {
      return [];
    }

    const pageText = text
      .split(/\n\s*---\s*PAGE BREAK\s*---\s*\n/i)
      .map((content) => content.trim())
      .filter(Boolean);

    return pageText.length > 0
      ? pageText
      : Array.from({ length: pageCount }, () => text);
  } catch (error) {
    console.error('OCR failed:', error.message);
    return [];
  }
};

export default extractWithOCR;