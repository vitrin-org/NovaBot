# NovaBot (نوابات)

AI-powered chatbot and recommendation engine for discovering digital tools and startups.

## Overview

NovaBot is a full-stack AI assistant that helps users find the best digital tools and startups for their needs. It features:

- **Onboarding Quiz**: A 5-step quiz collecting industry, challenge, role, team size, and budget
- **Smart Recommendations**: Hybrid semantic search + sponsor-weighted scoring via Qdrant vector DB
- **Curated Product Baskets**: LLM-generated baskets of 2-4 complementary tools with AI explanation
- **Conversational Chat**: Follow-up Q&A about recommended products with in-memory session history
- **Data Sources**: Mock JSON (default) or ProductPlus database/API integration
- **Embedding Options**: ChatWidget component for Next.js/React apps, or standalone script embedding

## Architecture

- **Backend**: FastAPI + LangChain + Qdrant (vector DB) + Google AI Studio (Gemini)
- **Frontend**: Next.js 14 + React 18 + Tailwind CSS
- **Embeddings**: `intfloat/multilingual-e5-large` (local SentenceTransformer) or OpenAI `text-embedding-3-small`
- **LLM**: Any OpenAI-compatible endpoint (configurable model)

```
[Main Website] → [ChatWidget (React)] → [FastAPI Backend] → [Qdrant Vector DB]
                                                                     ↓
                                                            [LLM API (Google AI Studio / Gemini)]
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for Qdrant)
- Google Gemini API key (from [Google AI Studio](https://aistudio.google.com/))

### 1. Start Qdrant (Vector Database)

```bash
cd backend
docker compose up -d
```

Qdrant runs at `http://localhost:6333`.

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API_BASE_URL, API_KEY, LLM_MODEL
python scripts/seed.py
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

### 4. Use It

1. Open `http://localhost:3000`
2. Click the chat icon in the bottom-right corner
3. Complete the 5-step onboarding quiz (industry, challenge, role, team size, budget)
4. Get your personalized product basket
5. Ask follow-up questions about the recommendations

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/v1/recommend` | Get product recommendations (list) |
| POST | `/api/v1/recommend/basket` | Get a curated product basket |
| POST | `/api/v1/chat` | Chat with follow-up questions |

### Example: Get a Product Basket

```bash
curl -X POST http://localhost:8000/api/v1/recommend/basket \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "برنامه‌نویسی",
    "category": "developer-tools",
    "challenge": "Need better project management",
    "budget": "paid",
    "role": "engineer",
    "team_size": "6-20"
  }'
```

## Project Structure

```
novabot/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py             # Entry point (CORS, routers)
│   │   ├── config.py           # Settings / environment
│   │   ├── schemas.py          # Pydantic data models
│   │   ├── routers/            # API routes (recommend, chat)
│   │   ├── services/           # Core services (embedding, vector_store, recommender, basket, chat)
│   │   ├── mock_data/          # Sample product data
│   │   └── productplus_config.py
│   ├── scripts/seed.py         # Data ingestion
│   ├── docker-compose.yml      # Qdrant container
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/                # Next.js app router (layout, globals.css, page)
│   │   ├── components/         # ChatWidget, OnboardingQuiz, BasketDisplay, ProductCard, ChatMessage
│   │   └── lib/                # api.ts, types.ts, config.ts
│   ├── package.json
│   ├── tailwind.config.ts      # Includes primary color palette
│   └── next.config.js
├── db/                         # Seed output (current_products.json)
├── INTEGRATION_README.md       # Integration guide for main website
├── INTEGRATION_GUIDE.md        # Persian integration guide
└── README.md                   # This file
```

## Adding NovaBot to Your Website

To integrate the NovaBot chat widget into your existing main website, see the **[Integration Guide (English)](INTEGRATION_README.md)** or **[راهنمای فارسی](INTEGRATION_GUIDE.md)**.

The integration involves two parts:

1. **Backend**: Deploy the FastAPI server with Qdrant, configure environment variables, and seed product data
2. **Frontend**: Copy the React components, install dependencies, configure the API endpoint, and render `<ChatWidget />` in your layout

## Environment Variables (.env)

All backend configuration lives in `backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `API_BASE_URL` | Google AI Studio endpoint | `https://generativelanguage.googleapis.com/v1beta` |
| `API_KEY` | Gemini API key (from Google AI Studio) | — |
| `LLM_MODEL` | Gemini model name (e.g., `gemini-1.5-flash`) | `gemini-1.5-flash` |
| `QDRANT_URL` | Qdrant vector DB URL | `http://localhost:6333` |
| `EMBEDDING_PROVIDER` | `local` (SentenceTransformer) or `openai` | `local` |
| `DATA_SOURCE` | `mock` (JSON) or `productplus` (real API/DB) | `mock` |
