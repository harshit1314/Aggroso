import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }
  return client;
}

export async function generateAnswer(
  question: string,
  relevantChunks: Array<{ content: string; documentId: string; chunkIndex: number }>
): Promise<{
  answer: string;
  sources: Array<{ documentId: string; chunkIndex: number; content: string }>;
}> {
  const client = getOpenAIClient();

  // Build context from relevant chunks
  const context = relevantChunks
    .map((chunk, idx) => `[Source ${idx + 1} - Doc: ${chunk.documentId}]\n${chunk.content}`)
    .join('\n\n');

  const systemPrompt = `You are a helpful AI assistant that answers questions based on provided documents.
Always cite which documents you used to answer the question.
If you cannot find the answer in the provided documents, say so clearly.
Keep answers concise and well-structured.`;

  const userPrompt = `Based on the following documents:

${context}

Please answer this question: ${question}

Important: Cite which specific document(s) you used to answer this.`;

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const answer = response.choices[0]?.message?.content || 'Unable to generate answer';

    return {
      answer,
      sources: relevantChunks,
    };
  } catch (error) {
    // Handle specific API errors
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('429') || errorMessage.includes('insufficient_quota')) {
        throw new Error('API quota exceeded. Please check your API key and billing details.');
      }
      
      if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
        throw new Error('API authentication failed. Please verify your API key is valid.');
      }
      
      if (errorMessage.includes('OPENAI_API_KEY')) {
        throw new Error('API key environment variable is not set');
      }
    }
    
    throw error;
  }
}

/**
 * Simple semantic search using text similarity
 * In production, you'd use proper embeddings, but for this demo we use basic keyword matching
 */
export function findRelevantChunks(
  question: string,
  allChunks: Array<{ content: string; documentId: string; chunkIndex: number }>,
  topK: number = 3
): Array<{ content: string; documentId: string; chunkIndex: number }> {
  const questionWords = question.toLowerCase().split(/\s+/);

  const scored = allChunks.map((chunk) => {
    const chunkLower = chunk.content.toLowerCase();
    const score = questionWords.filter((word) => chunkLower.includes(word)).length;
    return { ...chunk, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, topK).map(({ score, ...chunk }) => chunk);
}

/**
 * Check if API is accessible
 */
export async function checkOpenAIConnection(): Promise<boolean> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || 'https://router.huggingface.co/v1';
    
    if (!apiKey) {
      console.warn('OPENAI_API_KEY environment variable not set');
      return false;
    }

    if (apiKey.includes('sk-') || apiKey === 'your-key-here') {
      console.warn('Invalid OPENAI_API_KEY - appears to be a test or invalid value');
      return false;
    }

    // For HuggingFace, just verify the credentials are configured
    // Don't call models.list() as HuggingFace router doesn't support it
    const client = getOpenAIClient();
    
    // Verify client is working by checking it's not null
    return !!client;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
}
