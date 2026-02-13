This is a **Private Knowledge Q&A** application that lets you upload documents and ask questions powered by free AI models.

## Getting Started

run the development server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 with your browser.

## What This App Does

1. **Upload Documents** - Add TXT, Markdown, or CSV files
2. **Ask Questions** - Query your documents with natural language
3. **Get Answers** - Receive AI-generated responses with source citations
4. **Monitor Health** - Check backend/database/LLM status

## Features

- Document chunking and keyword-based retrieval
- HuggingFace Mistral-7B for question answering
- SQLite local database
- Responsive Tailwind UI
- Health check monitoring
- Error handling

## What's Not Implemented

- User authentication
- Vector embeddings (uses keywords)
- Document versioning
- Rate limiting
- Advanced logging

## Deployment

### Quick Deploy to Vercel (Recommended)
The easiest way to deploy a Next.js app:

1. Push to GitHub
2. Go to https://vercel.com and import your repository
3. Add `OPENAI_API_KEY` environment variable (your HuggingFace token)
4. Click Deploy
5. Your app is live!

### Deploy to Railway or Render
Both support automatic GitHub deployments with environment variables.

### Local Production
```bash
npm run build
npm run start
```

## License

MIT
