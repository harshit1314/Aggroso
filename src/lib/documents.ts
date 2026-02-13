import { getDatabase, runAsync, getAsync, allAsync, ensureInitialized } from './database';
import { v4 as uuidv4 } from 'uuid';

export interface Document {
  id: string;
  name: string;
  content: string;
  uploadedAt: string;
  wordCount: number;
}

export interface Chunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
}

const CHUNK_SIZE = 500; // Words per chunk

/**
 * Split document content into chunks for better Q&A
 */
function chunkDocument(content: string): string[] {
  const words = content.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    chunks.push(words.slice(i, i + CHUNK_SIZE).join(' '));
  }

  return chunks.length > 0 ? chunks : [content];
}

/**
 * Upload a new document
 */
export async function uploadDocument(name: string, content: string): Promise<Document> {
  getDatabase(); // Ensure DB is initialized
  
  const id = uuidv4();
  const uploadedAt = new Date().toISOString();
  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

  // Insert document
  await runAsync(
    `INSERT INTO documents (id, name, content, uploadedAt, wordCount)
     VALUES (?, ?, ?, ?, ?)`,
    [id, name, content, uploadedAt, wordCount]
  );

  // Create and insert chunks
  const chunks = chunkDocument(content);
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    await runAsync(
      `INSERT INTO chunks (id, documentId, chunkIndex, content)
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), id, index, chunk]
    );
  }

  return {
    id,
    name,
    content,
    uploadedAt,
    wordCount,
  };
}

/**
 * Get all documents
 */
export async function getAllDocuments(): Promise<Document[]> {
  getDatabase(); // Ensure DB is initialized
  
  return allAsync(`SELECT * FROM documents ORDER BY uploadedAt DESC`);
}

/**
 * Get a specific document
 */
export async function getDocument(id: string): Promise<Document | null> {
  getDatabase(); // Ensure DB is initialized
  
  return getAsync(`SELECT * FROM documents WHERE id = ?`, [id]);
}

/**
 * Delete a document and its chunks
 */
export async function deleteDocument(id: string): Promise<boolean> {
  getDatabase(); // Ensure DB is initialized
  
  // Delete from chunks first (or use ON DELETE CASCADE)
  await runAsync(`DELETE FROM documents WHERE id = ?`, [id]);
  return true;
}

/**
 * Get all chunks for a document
 */
export async function getDocumentChunks(documentId: string): Promise<Chunk[]> {
  getDatabase(); // Ensure DB is initialized
  
  return allAsync(
    `SELECT * FROM chunks WHERE documentId = ? ORDER BY chunkIndex`,
    [documentId]
  );
}

/**
 * Get all chunks across all documents (for searching)
 */
export async function getAllChunks(): Promise<Chunk[]> {
  getDatabase(); // Ensure DB is initialized
  
  return allAsync(`SELECT * FROM chunks ORDER BY documentId, chunkIndex`);
}

/**
 * Get total document count
 */
export async function getDocumentCount(): Promise<number> {
  getDatabase(); // Ensure DB is initialized
  
  const result = await getAsync(`SELECT COUNT(*) as count FROM documents`);
  return result?.count || 0;
}

/**
 * Get total word count across all documents
 */
export async function getTotalWordCount(): Promise<number> {
  getDatabase(); // Ensure DB is initialized
  
  const result = await getAsync(`SELECT SUM(wordCount) as total FROM documents`);
  return result?.total || 0;
}
