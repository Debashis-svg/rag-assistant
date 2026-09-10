import fs from 'fs';
import gemini from '../config/gemini.js';

const extractWithOCR = async (filePath) => {
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
Extract all readable text from this PDF.

Keep:
- headings
- paragraphs
- lists
- tables and their structure

Return only the extracted document content.
`
            }
          ]
        }
      ]
    });

    return response.text || '';
  } catch (error) {
    console.error('OCR failed:', error.message);
    return '';
  }
};

export default extractWithOCR;