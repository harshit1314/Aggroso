import { NextRequest, NextResponse } from 'next/server';
import { uploadDocument, getAllDocuments, deleteDocument } from '@/lib/documents';
import { ensureInitialized } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
    await ensureInitialized();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customName = (formData.get('name') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Only accept text files
    if (!file.type.startsWith('text/')) {
      return NextResponse.json(
        { error: 'Only text files are allowed' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large (max 10MB)' },
        { status: 400 }
      );
    }

    const content = await file.text();

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Validate content is mostly text (not binary)
    if (content.includes('\x00')) {
      return NextResponse.json(
        { error: 'File contains binary data' },
        { status: 400 }
      );
    }

    const documentName = customName || file.name;
    const document = await uploadDocument(documentName, content);

    return NextResponse.json(
      {
        success: true,
        document: {
          id: document.id,
          name: document.name,
          uploadedAt: document.uploadedAt,
          wordCount: document.wordCount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading document:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to upload document', details: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const documents = await getAllDocuments();
    return NextResponse.json({
      success: true,
      documents: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        uploadedAt: doc.uploadedAt,
        wordCount: doc.wordCount,
      })),
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteDocument(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete document', details: message },
      { status: 500 }
    );
  }
}
