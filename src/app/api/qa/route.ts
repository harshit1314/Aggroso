import { NextRequest, NextResponse } from 'next/server';
import { getAllChunks } from '@/lib/documents';
import { findRelevantChunks, generateAnswer } from '@/lib/ai';
import { ensureInitialized } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureInitialized();

    const body = await request.json();
    const { question } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      return NextResponse.json(
        { error: 'Question cannot be empty' },
        { status: 400 }
      );
    }

    if (trimmedQuestion.length > 2000) {
      return NextResponse.json(
        { error: 'Question is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    // Verify OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return NextResponse.json(
        {
          error: 'OpenAI API key is not configured',
          details: 'Please set the OPENAI_API_KEY environment variable',
        },
        { status: 500 }
      );
    }

    // Get all chunks
    let allChunks;
    try {
      allChunks = await getAllChunks();
    } catch (dbError) {
      console.error('Database error fetching chunks:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch documents from database' },
        { status: 500 }
      );
    }

    if (allChunks.length === 0) {
      return NextResponse.json(
        {
          success: true,
          answer: 'No documents are currently uploaded. Please upload some documents first.',
          sources: [],
        },
        { status: 200 }
      );
    }

    // Find relevant chunks
    const relevantChunks = findRelevantChunks(trimmedQuestion, allChunks, 3);

    if (relevantChunks.length === 0) {
      return NextResponse.json(
        {
          success: true,
          answer:
            'I could not find relevant information in the uploaded documents to answer your question.',
          sources: [],
        },
        { status: 200 }
      );
    }

    // Generate answer using AI
    try {
      const { answer, sources } = await generateAnswer(trimmedQuestion, relevantChunks);

      return NextResponse.json(
        {
          success: true,
          answer,
          sources: sources.map((source) => ({
            documentId: source.documentId,
            chunkIndex: source.chunkIndex,
            preview: source.content.substring(0, 200) + '...',
          })),
        },
        { status: 200 }
      );
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown error';
      
      // Handle quota errors
      if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
        return NextResponse.json(
          {
            error: 'API quota exceeded',
            details: errorMessage,
          },
          { status: 429 }
        );
      }
      
      // Handle authentication errors
      if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
        return NextResponse.json(
          {
            error: 'OpenAI API authentication failed',
            details: errorMessage,
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to generate answer',
          details: errorMessage 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in Q&A endpoint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error: ' + errorMessage },
      { status: 500 }
    );
  }
}
