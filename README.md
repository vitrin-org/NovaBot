# NovaBot (نوابات)

AI-powered chatbot and recommendation engine for discovering digital tools and startups.

## Architecture

- **Backend**: FastAPI + LangChain + Qdrant (vector DB)
- **Frontend**: Next.js + Tailwind CSS
- **Embeddings**: OpenAI text-embedding-3-small (primary) / multilingual-e5-large (local fallback)

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for Qdrant)
- OpenAI API key

### 1. Start Qdrant

```bash
cd backend
docker compose up -d
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your OPENAI_API_KEY
python scripts/seed.py
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

### 4. Use It

1. Open `http://localhost:3000`
2. Click the chat icon in the bottom-right corner
3. Complete the 3-step onboarding quiz
4. Get your personalized product basket
5. Ask follow-up questions about the recommendations

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/v1/recommend` | Get product recommendations |
| POST | `/api/v1/recommend/basket` | Get a curated product basket |
| POST | `/api/v1/chat` | Chat with follow-up questions |
