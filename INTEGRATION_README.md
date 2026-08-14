# NovaBot Chat Integration Guide

This guide explains how to integrate the NovaBot AI chat widget into your main website—both the frontend button/widget and the backend API server. After following these steps, the chat widget will appear on your site and communicate directly with your NovaBot backend.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Architecture Overview](#2-architecture-overview)
3. [Backend Integration](#3-backend-integration)
   - [3.1 Prerequisites](#31-prerequisites)
   - [3.2 Environment Configuration (.env)](#32-environment-configuration-env)
   - [3.3 Run Qdrant (Vector Database)](#33-run-qdrant-vector-database)
   - [3.4 Install Dependencies](#34-install-dependencies)
   - [3.5 Seed Product Data](#35-seed-product-data)
   - [3.6 Start the Backend Server](#36-start-the-backend-server)
   - [3.7 Connect to a Real Product API](#37-connect-to-a-real-product-api)
   - [3.8 Deploy Backend to Production](#38-deploy-backend-to-production)
4. [Frontend Integration](#4-frontend-integration)
   - [4.1 Required Files](#41-required-files)
   - [4.2 Install Dependencies](#42-install-dependencies)
   - [4.3 Tailwind Configuration](#43-tailwind-configuration)
   - [4.4 Configure the API Endpoint](#44-configure-the-api-endpoint)
   - [4.5 Brand Configuration](#45-brand-configuration)
   - [4.6 Add the ChatWidget to Your Page](#46-add-the-chatwidget-to-your-page)
   - [4.7 Build for Production](#47-build-for-production)
5. [Embedding as a Standalone Script (Optional)](#5-embedding-as-a-standalone-script-optional)
6. [API Reference](#6-api-reference)
7. [Data Schema](#7-data-schema)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Project Structure

```
novabot/
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # FastAPI entry point (CORS, router registration)
│   │   ├── config.py                 # Settings / environment variables
│   │   ├── schemas.py                # Pydantic models (QuizResponse, ProductBasket, ChatRequest)
│   │   ├── routers/
│   │   │   ├── recommend.py          # POST /api/v1/recommend, /api/v1/recommend/basket
│   │   │   └── chat.py               # POST /api/v1/chat
│   │   ├── services/
│   │   │   ├── embedding.py          # Text → vector (local SentenceTransformer or OpenAI)
│   │   │   ├── vector_store.py       # Qdrant client wrapper (create, upsert, search)
│   │   │   ├── recommender.py        # Hybrid semantic + sponsor-weighted scoring
│   │   │   ├── basket.py             # LLM-powered basket generation (JSON output)
│   │   │   └── chat.py               # LLM conversation (in-memory session history)
│   │   ├── mock_data/
│   │   │   └── products.json         # Sample product data
│   │   └── productplus_config.py     # ProductPlus DB category/status mappings
│   ├── scripts/
│   │   └── seed.py                   # Data ingestion script (mock or ProductPlus)
│   ├── docker-compose.yml            # Qdrant container
│   ├── requirements.txt
│   ├── .env / .env.example
│   └── venv/
├── frontend/                          # Next.js + Tailwind frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout (globals.css, metadata)
│   │   │   ├── globals.css           # Tailwind directives
│   │   │   └── page.tsx              # Home page (renders ChatWidget)
│   │   ├── components/
│   │   │   ├── ChatWidget.tsx        # Main chat widget (toggle, quiz, basket, chat)
│   │   │   ├── OnboardingQuiz.tsx    # 5-step quiz (industry, challenge, role, team, budget)
│   │   │   ├── BasketDisplay.tsx     # Product basket display
│   │   │   ├── ProductCard.tsx       # Individual product card with feedback buttons
│   │   │   └── ChatMessage.tsx       # Message bubble (react-markdown rendering)
│   │   └── lib/
│   │       ├── api.ts                # Fetch API calls (recommendBasket, sendMessage)
│   │       ├── types.ts              # TypeScript interfaces (QuizData, ProductBasket, etc.)
│   │       └── config.ts             # Brand name configuration
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── db/                                # Output: current_products.json
├── README.md
├── INTEGRATION_README.md              # ← This file
└── INTEGRATION_GUIDE.md               # Persian version of this guide
```

---

## 2. Architecture Overview

```
[Your Main Website]
        │
        │  (1) User clicks chat icon
        ▼
[NovaBot ChatWidget] ←→ [Your Website JS/CSS]
        │
        │  (2) HTTP POST /api/v1/recommend/basket
        ▼
[NovaBot Backend (FastAPI)]
        │
        │  (3) Embed + Qdrant vector search
        ▼
[Qdrant Vector DB]
        │
        │  (4) LLM (OpenAI-compatible) via proxy
        ▼
[LLM API (e.g. GPT-5-mini, Gemini)]
        │
        │  (5) Responses flow back to widget
        ▼
[Your Website — ChatWidget displays results]
```

**Data flow:**

1. User clicks the chat icon (bottom-right corner).
2. The `OnboardingQuiz` collects industry, challenge, role, team size, and budget.
3. The frontend sends a `POST /api/v1/recommend/basket` request with the quiz data.
4. The backend embeds the query, searches Qdrant for similar products, applies hybrid scoring (semantic similarity + sponsor weighting), and passes results to an LLM that generates a curated JSON basket.
5. The frontend renders the basket with `BasketDisplay` → `ProductCard` components.
6. User can ask follow-up questions via `POST /api/v1/chat`; the conversation is maintained in memory per `session_id`.

---

## 3. Backend Integration

### 3.1 Prerequisites

- Python 3.11+
- Docker (for Qdrant)
- An OpenAI-compatible API endpoint (e.g., `https://hooshyar.payampardaz.com/api/v1`) and valid API key
- Node.js 18+ (for optional frontend build)

### 3.2 Environment Configuration (.env)

Copy the template and fill in your values:

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
# LLM API (OpenAI-compatible)
API_BASE_URL=https://your-llm-provider.com/v1
API_KEY=sk-your-api-key-here

# LLM model name (must be available at your API endpoint)
LLM_MODEL=gpt-5-mini

# Qdrant vector database
QDRANT_URL=http://localhost:6333

# Embedding provider: "local" (SentenceTransformer) or "openai"
EMBEDDING_PROVIDER=local

# Product data source: "mock" (local JSON) or "productplus" (real DB/API)
DATA_SOURCE=mock
```

### 3.3 Run Qdrant (Vector Database)

Qdrant stores product embeddings for semantic search. Start it via Docker:

```bash
cd backend
docker compose up -d
```

Qdrant will be available at `http://localhost:6333`. The web UI (if enabled) is at `http://localhost:6334`.

### 3.4 Install Dependencies

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3.5 Seed Product Data

Before the chatbot can recommend products, you must populate Qdrant with embeddings.

**Option A: Use mock data (quick start)**

```bash
cd backend
venv/bin/python scripts/seed.py
```

This loads products from `app/mock_data/products.json`, generates embeddings, and upserts them into Qdrant.

**Option B: Connect to a real Product API**

If your project has a real product API, modify the seeding script (see [3.7](#37-connect-to-a-real-product-api)).

### 3.6 Start the Backend Server

```bash
cd backend
venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now available at `http://localhost:8000`:
- Health check: `GET /`
- Recommendations: `POST /api/v1/recommend` and `POST /api/v1/recommend/basket`
- Chat: `POST /api/v1/chat`

### 3.7 Connect to a Real Product API

By default, the backend uses mock data. To integrate with your real product API:

1. **Set environment variable:**

```env
DATA_SOURCE=productplus
```

2. **Choose access mode in `backend/app/config.py`:**

| Mode | Setting | Description |
|------|---------|-------------|
| Database | `PRODUCTPLUS_ACCESS_MODE=db` | Connects to PostgreSQL using `PRODUCTPLUS_HOST`, `PRODUCTPLUS_PORT`, `PRODUCTPLUS_DB`, `PRODUCTPLUS_USER`, `PRODUCTPLUS_PASSWORD` |
| API | `PRODUCTPLUS_ACCESS_MODE=api` | Fetches from a REST endpoint using `PRODUCTPLUS_API_URL` and `PRODUCTPLUS_API_KEY` |

3. **Or create a custom sync script:**

If your product API returns data in a different format, create a custom sync script:

```python
# backend/scripts/sync_real_products.py
import asyncio
import httpx
from backend.app.services.vector_store import vector_store

async def main():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://your-api.com/api/products",
            headers={"Authorization": "Bearer YOUR_API_KEY"}
        )
        response.raise_for_status()
        products = response.json()

    vector_store.create_collection()
    vector_store.upsert_products(products)
    print(f"Synced {len(products)} products")

if __name__ == "__main__":
    asyncio.run(main())
```

**Product data format expected by `vector_store.upsert_products()`:**

```json
[
  {
    "product_id": "unique_id",
    "name": "Product Name",
    "summary": "Short 1-2 sentence description",
    "full_description": "Full product description",
    "categories": ["category1", "category2"],
    "sponsor_tier": 1,
    "pricing_type": "free",   // or "subscription", "pay-per-use"
    "target_audience": "developers"
  }
]
```

### 3.8 Deploy Backend to Production

**Using uvicorn + gunicorn (recommended):**

```bash
pip install gunicorn
gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000 app.main:app
```

**Using Docker (example `Dockerfile`):**

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Nginx reverse proxy:**

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /var/www/novabot-frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. Frontend Integration

### 4.1 Required Files

Copy these files from `frontend/src/` into your project's `src/` directory:

```
src/
├── components/
│   ├── ChatWidget.tsx              # Main widget (floating button + chat modal)
│   ├── OnboardingQuiz.tsx          # 5-step onboarding quiz
│   ├── BasketDisplay.tsx           # Product basket display
│   ├── ProductCard.tsx             # Individual product card
│   └── ChatMessage.tsx             # Chat message bubble
└── lib/
    ├── api.ts                      # API client (recommendBasket, sendMessage)
    ├── types.ts                    # TypeScript interfaces
    └── config.ts                   # Brand configuration
```

> **Note:** All components use `use client` and are React 18 compatible (Next.js 14).

### 4.2 Install Dependencies

In your project's `package.json`, add:

```bash
npm install react-markdown @tailwindcss/typography
```

Full dependency list (from NovaBot's `package.json`):

```json
{
  "dependencies": {
    "@tailwindcss/typography": "^0.5.20",
    "next": "^14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-markdown": "^10.1.0",
    "tailwindcss": "^3.4.19"
  }
}
```

### 4.3 Tailwind Configuration

If your project already uses Tailwind, copy the `primary` color palette from `frontend/tailwind.config.ts`:

```javascript
// tailwind.config.js or tailwind.config.ts
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
```

Ensure your CSS includes Tailwind directives:

```css
/* src/app/globals.css (or equivalent) */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4.4 Configure the API Endpoint

In `src/lib/api.ts`, set the backend URL to match your deployment:

```typescript
// Development
const API_BASE = "http://localhost:8000/api/v1";

// Production
const API_BASE = "https://your-backend-domain.com/api/v1";
```

For Next.js projects, you can use environment variables:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_NOVABOT_API_URL || "http://localhost:8000/api/v1";
```

And create a `.env.local` file:

```env
NEXT_PUBLIC_NOVABOT_API_URL=https://your-backend-domain.com/api/v1
```

### 4.5 Brand Configuration

Edit `src/lib/config.ts` to rebrand the widget:

```typescript
// src/lib/config.ts
export const BRAND = {
  name: "YourBrand",
  nameFa: "نوآوری",        // Persian name shown in widget header
  tagline: "Smart Tool Advisor",  // English tagline
  taglineEn: "Smart Tool Advisor",
  description: "Find the best digital tools for your needs",  // Shown in widget subtitle
};
```

### 4.6 Add the ChatWidget to Your Page

#### Next.js App Router (`app/layout.tsx`)

```tsx
import ChatWidget from "@/components/ChatWidget";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* ChatWidget appears on every page */}
        <ChatWidget />
      </body>
    </html>
  );
}
```

#### Next.js Pages Router (`pages/_app.tsx`)

```tsx
import type { AppProps } from "next/app";
import ChatWidget from "@/components/ChatWidget";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <ChatWidget />
    </>
  );
}
```

#### React (Vite / CRA)

```tsx
// src/App.tsx
import ChatWidget from "./components/ChatWidget";

function App() {
  return (
    <div className="App">
      {/* Your app content */}
      <ChatWidget />
    </div>
  );
}
```

The ChatWidget renders as a floating button (bottom-right corner) that expands into a full chat panel. No additional CSS needed—it's self-contained.

### 4.7 Build for Production

```bash
npm run build
```

- Next.js output goes to `.next/` (SSR) or `out/` (static export with `next export`).
- Upload the build output to your web server.

---

## 5. Embedding as a Standalone Script (Optional)

To embed NovaBot on **any website** (not just your own React/Next.js app) without bundling:

1. **Build the widget as a standalone bundle** using a tool like Webpack, Vite Library Mode, or esbuild.
2. Host the compiled JS file on a CDN.
3. Add a single `<script>` tag to your main site:

```html
<!-- In your main site's <head> or before closing </body> -->
<script src="https://cdn.your-domain.com/novabot-widget.js"></script>
<link rel="stylesheet" href="https://cdn.your-domain.com/novabot-widget.css">

<!-- Initialize the widget -->
<script>
  window.NovaBot.init({
    apiBase: "https://your-backend.com/api/v1",
    brand: {
      name: "YourBrand",
      nameFa: "نوابات",
      description: "AI-powered digital tool advisor",
    },
  });
</script>
```

This approach requires wrapping the React components in a Web Component or vanilla JS mount. Refer to the Next.js build output and consider using `@open-wc/build-helpers` or a similar bundler for this advanced use case.

---

## 6. API Reference

### 6.1 Health Check

```
GET /
```

**Response:**
```json
{
  "status": "ok",
  "service": "NovaBot AI"
}
```

### 6.2 Product Recommendations

```
POST /api/v1/recommend
```

**Request:**
```json
{
  "industry": "برنامه‌نویسی",
  "category": "developer-tools",
  "challenge": "Need better project management tools",
  "budget": "paid",
  "role": "engineer",
  "team_size": "6-20"
}
```

**Response:**
```json
[
  {
    "product_id": "p001",
    "title": "TaskFlow Pro",
    "description": "Project management tool for remote teams",
    "category": "project-management",
    "pricing_type": "subscription",
    "sponsor_tier": 3,
    "match_score": 0.85,
    "role_in_basket": "Project tracking",
    "is_featured": true
  }
]
```

### 6.3 Product Basket

```
POST /api/v1/recommend/basket
```

**Request:** Same as `/recommend`.

**Response:**
```json
{
  "basket_title": "ابزارهای پیشنهادی برای تیم برنامه‌نویسی",
  "summary_reasoning": "انتخاب شده‌اند تا تمام جنبه‌های توسعه را پوشش دهند.",
  "selected_products": [
    { "product_id": "p001", "title": "TaskFlow Pro", ... }
  ],
  "total_estimated_cost_range": "$50-200/ماه"
}
```

### 6.4 Chat

```
POST /api/v1/chat
```

**Request:**
```json
{
  "message": "Tell me about TaskFlow Pro pricing",
  "session_id": "user-123",
  "basket_context": { ... }  // optional, includes current basket
}
```

**Response:**
```json
{
  "message": "TaskFlow Pro offers three plans...",
  "session_id": "user-123"
}
```

---

## 7. Data Schema

### 7.1 QuizData (Frontend → Backend)

| Field | Type | Description |
|-------|------|-------------|
| `industry` | string | Industry label (e.g., "برنامه‌نویسی" / "نرم‌افزار (SaaS)") |
| `category` | string | Technical category slug (e.g., "developer-tools") |
| `challenge` | string | User's main challenge/problem |
| `budget` | "free" \| "paid" | Budget preference |
| `role` | string | User role (founder, engineer, product-manager, etc.) |
| `team_size` | string | Team size (1-5, 6-20, 21-100, 100+) |

### 7.2 ProductBasket (Backend → Frontend)

| Field | Type | Description |
|-------|------|-------------|
| `basket_title` | string | Curated title (Persian) |
| `summary_reasoning` | string | Why these products were chosen |
| `selected_products` | `ProductItem[]` | List of recommended products |
| `total_estimated_cost_range` | string | Price range summary |

### 7.3 ProductItem

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | string | Unique product identifier |
| `title` | string | Product name |
| `description` | string | Short description |
| `category` | string | Category slug |
| `pricing_type` | string | free, subscription, pay-per-use |
| `sponsor_tier` | int | 0=normal, 1=bronze, 2=gold, 3=platinum |
| `match_score` | float | 0.0–1.0 relevance score |
| `role_in_basket` | string | Role this product plays in the basket |
| `is_featured` | boolean | Whether this is a sponsored/highlighted product |

---

## 8. Troubleshooting

### ChatWidget doesn't appear

- Ensure `<ChatWidget />` is imported and rendered in your layout (`app/layout.tsx`).
- Check the browser console for JavaScript errors.
- Verify Tailwind CSS is configured (the widget uses `bg-primary-600`, `rounded-full`, etc.).

### API calls fail with CORS error

The backend has CORS configured for `localhost:3000` by default. Update `backend/app/main.py` to allow your production domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-production-domain.com",  # Add your domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### "Failed to get recommendations" in chat

- Verify the backend server is running: `curl http://localhost:8000/`
- Check that Qdrant is running: `docker compose ps` in `backend/`
- Ensure `.env` is configured with valid `API_BASE_URL` and `API_KEY`.
- Run `python scripts/seed.py` to populate Qdrant with product data.

### Widget text is in Persian but I want English

The widget is currently configured for Persian (RTL). To switch to English:

- In `ChatWidget.tsx`, remove `dir="rtl"` from the container div.
- Replace Persian strings in `OnboardingQuiz.tsx`, `BasketDisplay.tsx`, and `ChatWidget.tsx` with English equivalents.
- Update `BRAND.nameFa` in `config.ts` or use `BRAND.name` instead.

### Embeddings are slow or fail

- If using `EMBEDDING_PROVIDER=local`, the first load downloads the `multilingual-e5-large` model (~1GB). Ensure you have a stable internet connection and disk space.
- If using `EMBEDDING_PROVIDER=openai`, verify `API_BASE_URL` points to your OpenAI-compatible endpoint and `API_KEY` is valid.

### Chat history resets on page refresh

The widget stores sessions in `localStorage` under the key `digiyar_sessions`. Sessions are saved automatically. If localStorage is blocked (e.g., in an iframe with `SameSite=None`), sessions won't persist.

### Qdrant connection refused

- Ensure Qdrant is running: `docker compose up -d` in `backend/`
- Verify `QDRANT_URL` in `.env` matches the container's published port (default `http://localhost:6333`).

### Production deployment checklist

- [ ] Set `DATA_SOURCE=productplus` (or keep `mock` for testing)
- [ ] Configure `API_BASE_URL` and `API_KEY` with production LLM credentials
- [ ] Set `EMBEDDING_PROVIDER` to `openai` for production (faster, no model download)
- [ ] Seed products via `python scripts/seed.py`
- [ ] Run uvicorn/gunicorn on port 8000
- [ ] Configure Nginx with SSL (HTTPS) and reverse proxy `/api/` to backend
- [ ] Build frontend: `npm run build`
- [ ] Set frontend `API_BASE` to production backend URL
- [ ] Add your production domain to CORS `allow_origins`
- [ ] Test end-to-end: open your site, click the chat icon, complete the quiz, verify recommendations render
