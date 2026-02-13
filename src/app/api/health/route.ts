import { NextResponse } from 'next/server';
import { getDocumentCount, getTotalWordCount } from '@/lib/documents';
import { checkOpenAIConnection } from '@/lib/ai';
import { ensureInitialized } from '@/lib/database';

export async function GET() {
  const health: any = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: 'unknown',
      llm: 'unknown',
      app: 'running',
    },
    stats: {
      documentsCount: 0,
      totalWords: 0,
    },
  };

  try {
    // Ensure database is initialized
    await ensureInitialized();

    // Check database
    try {
      const docCount = await getDocumentCount();
      const wordCount = await getTotalWordCount();

      health.services.database = 'connected';
      health.stats.documentsCount = docCount;
      health.stats.totalWords = wordCount;
    } catch (error) {
      health.services.database = 'failed';
      health.status = 'degraded';
      console.error('Database health check failed:', error);
    }

    // Check OpenAI/LLM connection
    try {
      const isConnected = await checkOpenAIConnection();
      if (!isConnected) {
        // Check if API key is missing
        if (!process.env.OPENAI_API_KEY) {
          health.services.llm = 'failed - missing OPENAI_API_KEY';
        } else {
          health.services.llm = 'failed - invalid credentials';
        }
        health.status = 'degraded';
      } else {
        health.services.llm = 'connected';
      }
    } catch (error) {
      health.services.llm = 'failed';
      health.status = 'degraded';
      console.error('LLM health check failed:', error);
    }

    const statusCode =
      health.services.database === 'failed' || health.services.llm === 'failed' ? 503 : 200;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    health.status = 'unhealthy';
    health.error = error instanceof Error ? error.message : 'Unknown error';
    // Always return JSON, even on error
    return NextResponse.json(health, { status: 503 });
  }
}
