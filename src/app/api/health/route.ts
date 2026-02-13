import { NextResponse } from 'next/server';
import { getDocumentCount, getTotalWordCount } from '@/lib/documents';
import { checkOpenAIConnection } from '@/lib/ai';
import { getDatabase } from '@/lib/database';

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
    // Check database
    try {
      getDatabase();
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
      health.services.llm = isConnected ? 'connected' : 'failed';
      if (!isConnected) {
        health.status = 'degraded';
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
    return NextResponse.json(health, { status: 503 });
  }
}
