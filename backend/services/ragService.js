import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

import gemini from '../config/gemini.js';
import { pineconeIndex } from '../config/pinecone.js';

const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    outputDimensionality: 3072,
});

const isOverviewQuestion = (question) =>
    /\b(what is|what's|tell me about|describe|summari[sz]e|overview|main (topic|idea|purpose)|document about)\b/i.test(
        question
    );

const rewriteQuery = async (question, history = []) => {
    if (!history.length) {
        return question;
    }

    const recentHistory = history
        .slice(-6)
        .map((message) => `${message.role}: ${message.content}`)
        .join('\n');

    // Convert follow-up questions into complete standalone questions
    const response = await gemini.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: `
Conversation:
${recentHistory}

Latest question:
${question}

Rewrite the latest question as a clear standalone search query.
Return only the rewritten query.
`
    });

    return response.text?.trim() || question;
};

const semanticSearch = async ( // Take the user's question → convert it into a vector → search Pinecone for semantically similar document chunks → restrict results to documents belonging to that user.
    query,
    documentId,
    userId
) => {
    const vector = await embeddings.embedQuery(query);

    const filter = {
        userId: {
            $eq: userId.toString()
        }
    };

    // Restrict retrieval to documents selected by the user
    if (documentId) {
        filter.documentId = {
            $eq: documentId.toString()
        };
    }

    const result = await pineconeIndex.query({
        vector,
        topK: 20,
        includeMetadata: true,
        includeValues: false,
        filter
    });

    return result.matches || [];
};

const keywordBoost = (results, query) => {
    const words = query
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 2);

    return results // results refers to the relevant vectors
        .map((item) => {  // item refers to a single vertor from the relevant vectors
            const text = (
                item.metadata?.text || ''
            ).toLowerCase();

            let matches = 0;

            for (const word of words) {
                if (text.includes(word)) {
                    matches++;
                }
            }

            const keywordScore =
                words.length > 0
                    ? matches / words.length
                    : 0;

            // Combine semantic similarity with simple keyword relevance
            const finalScore =
                // item.score comes from your vector similarity search.
                (item.score || 0) * 0.8 +
                keywordScore * 0.2;

            return {
                ...item,
                finalScore
            };
        })
        .sort((a, b) => b.finalScore - a.finalScore);
};

const rerankResults = async (query, results) => {
    if (results.length <= 5) {
        return results;
    }

    // Only consider the top 10 results from my initial search for further re-ranking.
    const candidates = results
        .slice(0, 10)
        .map(
            (item, index) =>
                `[${index}]
${item.metadata?.text?.slice(0, 1200) || ''}`
        )
        .join('\n\n');

    // Gemini chooses the chunks that are most useful for answering the question
    const response = await gemini.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        contents: `
Question:
${query}

Chunks:
${candidates}

Return the indexes of the 5 most relevant chunks.

Return only comma-separated numbers.
Example:
0,3,2,5,1
`
    });

    const indexes = (response.text || '')
        .split(',')
        .map((item) => Number(item.trim()))
        .filter(
            (index) =>
                Number.isInteger(index) &&
                index >= 0 &&
                index < results.length
        );

    if (!indexes.length) {
        return results.slice(0, 5);
    }

    return indexes
        .slice(0, 5)
        .map((index) => results[index]);
};

const prepareRagContext = async ({
    question,
    history = [],
    documentId,
    userId
}) => {
    // Step 1: Rewrite conversational follow-up into standalone query
    const rewrittenQuery = await rewriteQuery(
        question,
        history
    );

    const overviewQuestion = isOverviewQuestion(question);
    const retrievalQuery = overviewQuestion
        ? `${rewrittenQuery}. Identify the document's subject, purpose, main topics, and key information.`
        : rewrittenQuery;

    // Step 2: Retrieve a wider candidate set from Pinecone
    const semanticResults = await semanticSearch(
        retrievalQuery,
        documentId,
        userId
    );

    // Step 3: Combine semantic similarity with keyword relevance
    const hybridResults = keywordBoost(
        semanticResults,
        retrievalQuery
    );

    // Step 4: Remove weak matches to reduce hallucination
    const relevantResults = overviewQuestion
        ? hybridResults.filter((item) => item.finalScore >= 0.2)
        : hybridResults.filter((item) => item.finalScore >= 0.35);

    // Overview questions need representative chunks, even when they have
    // little keyword overlap with the document's wording.
    const usableResults = overviewQuestion
        ? (relevantResults.length > 0
            ? relevantResults
            : hybridResults.slice(0, 5))
        : relevantResults;

    if (!usableResults.length) {
        return {
            rewrittenQuery,
            context: '',
            sources: []
        };
    }

    // Step 5: Keep only the chunks most relevant to the question
    const finalResults = await rerankResults(
        rewrittenQuery,
        usableResults
    );

    const context = finalResults
        .map((item, index) => {
            return `
SOURCE ${index + 1}
File: ${item.metadata?.fileName || 'Unknown'}
Page: ${item.metadata?.pageNumber || 'Unknown'}

${item.metadata?.text || ''}
`;
        })
        .join('\n');

    const sources = finalResults.map((item) => ({
        documentId: item.metadata?.documentId,
        fileName: item.metadata?.fileName,
        pageNumber: item.metadata?.pageNumber,
        text: item.metadata?.text
    }));

    return {
        rewrittenQuery,
        context,
        sources
    };
};

const generateSuggestions = async (
    question,
    answer
) => {
    try {
        const response = await Promise.race([
            gemini.models.generateContent({
                model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
                contents: `
Question:
${question}

Answer:
${answer}

Generate 3 short useful follow-up questions.

Return one question per line.
Do not number them.
`
            }),
            new Promise((_, reject) => {
                setTimeout(
                    () => reject(new Error('Suggestion generation timed out')),
                    15000
                );
            })
        ]);

        return (response.text || '')
            .split('\n')
            .map((item) => item.replace(/^[-•]\s*/, '').trim())
            .filter(Boolean)
            .slice(0, 3);
    } catch {
        return [];
    }
};

export {
    prepareRagContext,
    generateSuggestions
};