# DigiYaar - Backend

FastAPI backend with hybrid recommendation engine and conversational AI.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | (required) |
| `QDRANT_URL` | Qdrant server URL | `http://localhost:6333` |
| `EMBEDDING_PROVIDER` | `openai` or `local` | `openai` |

## Running

```bash
# Start Qdrant
docker compose up -d

# Seed mock data
python scripts/seed.py

# Start API server
uvicorn app.main:app --reload
```

## Project Structure

```
app/
├── main.py              # FastAPI app
├── config.py            # Settings
├── schemas.py           # Pydantic models
├── services/
│   ├── embedding.py     # Embedding service
│   ├── vector_store.py  # Qdrant wrapper
│   ├── recommender.py   # Hybrid recommendation
│   ├── basket.py        # Product basket generator
│   └── chat.py          # Conversational AI
├── routers/
│   ├── recommend.py     # Recommendation endpoints
│   └── chat.py          # Chat endpoint
└── mock_data/
    └── products.json    # Sample products
```
