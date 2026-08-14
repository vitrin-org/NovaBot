# راهنمای اتصال چت‌بات NovaBot به سایت واقعی

## خلاصه

این سند توضیح می‌دهد چطور چت‌بات هوشمند NovaBot را به سایت واقعی خود متصل کنید و به جای داده‌های نمونه، از API واقعی محصولات استفاده کنید.

---

## ۱. ساختار پروژه

```
novabot/
├── backend/                    # سرور FastAPI
│   ├── app/
│   │   ├── main.py            # نقطه ورود API
│   │   ├── config.py          # تنظیمات
│   │   ├── schemas.py         # مدل‌های داده
│   │   ├── services/
│   │   │   ├── embedding.py   # تبدیل متن به بردار
│   │   │   ├── vector_store.py # ذخیره و جستجوی بردارها
│   │   │   ├── recommender.py # موتور توصیه ترکیبی
│   │   │   ├── basket.py      # ساخت سبد محصول
│   │   │   └── chat.py        # گفتگوی هوشمند
│   │   ├── routers/
│   │   │   ├── recommend.py   # API پیشنهادات
│   │   │   └── chat.py        # API چت
│   │   └── mock_data/
│   │       └── products.json  # داده نمونه (حذف می‌شود)
│   ├── scripts/
│   │   └── seed.py            # اسکریپت بارگذاری داده
│   ├── docker-compose.yml     # Qdrant
│   ├── requirements.txt
│   └── .env
├── frontend/                   # رابط کاربری React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWidget.tsx  # ویجت اصلی چت
│   │   │   ├── OnboardingQuiz.tsx
│   │   │   ├── BasketDisplay.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── ChatMessage.tsx
│   │   ├── lib/
│   │   │   ├── api.ts          # اتصال به بک‌اند
│   │   │   └── types.ts        # تایپ‌ها
│   │   └── app/
│   └── package.json
└── INTEGRATION_GUIDE.md        # همین فایل
```

---

## ۲. اتصال به API واقعی محصولات

### ۲.۱. فرمت مورد انتظار API شما

بک‌اند ما انتظار دارد API محصولات شما لیستی از محصولات را برگرداند. فرمت مورد نیاز:

```json
[
  {
    "product_id": "string",
    "name": "string",
    "summary": "string",
    "full_description": "string",
    "pricing_type": "string",
    "target_audience": "string"
  }
]
```

### ۲.۲. فیلدهای توضیحی

| فیلد | نوع | توضیح |
|------|------|-------|
| `product_id` | string | شناسه یکتای محصول در سیستم شما |
| `name` | string | نام محصول |
| `summary` | string | خلاصه کوتاه (۱-۲ جمله) |
| `full_description` | string | توضیح کامل محصول |
| `categories` | string[] | دسته‌بندی‌ها (مثلاً `["project-management", "productivity"]`) |
| `sponsor_tier` | int | سطح حمایت مالی: 0=عادی, 1=برنزی, 2=طلایی, 3=پلاتینی |
| `pricing_type` | string | نوع قیمت: `free`, `freemium`, `subscription`, `pay-per-use` |
| `target_audience` | string | مخاطب هدف |

### ۲.۳. اتصال API واقعی به بک‌اند

در فایل `backend/app/services/vector_store.py`، تابع `upsert_products` را تغییر دهید تا از API واقعی شما داده بگیرد:

```python
import httpx

async def fetch_products_from_api(api_url: str) -> list[dict]:
    """محصولات را از API واقعی دریافت کنید"""
    async with httpx.AsyncClient() as client:
        response = await client.get(api_url)
        response.raise_for_status()
        return response.json()

async def sync_products(api_url: str):
    """همگام‌سازی محصولات از API به Qdrant"""
    products = await fetch_products_from_api(api_url)
    vector_store.create_collection()
    vector_store.upsert_products(products)
    print(f"{len(products)} products synced.")
```

### ۲.۴. اسکریپت همگام‌سازی خودکار

یک اسکریپت برای همگام‌سازی دوره‌ای محصولات بسازید:

```python
# scripts/sync_real_products.py
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.vector_store import sync_products

API_URL = "https://your-real-api.com/api/products"  # ← آدرس API خودتان

async def main():
    print(f"Syncing products from {API_URL}...")
    await sync_products(API_URL)
    print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
```

اجرا:
```bash
cd backend
venv/Scripts/python.exe scripts/sync_real_products.py
```

---

## ۳. اتصال فرانت‌اند به سایت واقعی

### ۳.۱. کپی کردن فایل‌های چت‌بات

فایل‌های زیر را از پروژه `frontend/src/` به پروژه واقعی خود کپی کنید:

```
src/
├── components/
│   ├── ChatWidget.tsx
│   ├── OnboardingQuiz.tsx
│   ├── BasketDisplay.tsx
│   ├── ProductCard.tsx
│   └── ChatMessage.tsx
└── lib/
    ├── api.ts
    └── types.ts
```

### ۳.۲. تنظیم آدرس API

در فایل `src/lib/api.ts`، آدرس بک‌اند را تغییر دهید:

```typescript
// محیط توسعه
const API_BASE = "http://localhost:8000/api/v1";

// محیط production
// const API_BASE = "https://your-domain.com/api/v1";
```

### ۳.۳. اضافه کردن ویجت چت به سایت

در فایل اصلی سایت خود (مثلاً `app/layout.tsx` یا `pages/_app.tsx`):

```tsx
import ChatWidget from "@/components/ChatWidget";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
```

### ۳.۴. پکیج‌های مورد نیاز

پکیج‌های زیر را در پروژه واقعی نصب کنید:

```bash
npm install react-markdown @tailwindcss/typography
```

### ۳.۵. تنظیم Tailwind

در فایل `tailwind.config.js` یا `tailwind.config.ts`:

```javascript
module.exports = {
  // ... تنظیمات قبلی
  plugins: [require("@tailwindcss/typography")],
}
```

### ۳.۶. رنگ‌های سفارشی

اگر رنگ `primary` ندارید، آن را اضافه کنید:

```javascript
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
```

---

## ۴. استقرار در Production

### ۴.۱. بک‌اند

```bash
# ۱. Qdrant را روی سرور اجرا کنید
docker compose up -d

# ۲. متغیرهای محیطی را تنظیم کنید
cp .env.example .env
# .env را ویرایش کنید

# ۳. داده‌ها را همگام‌سازی کنید
venv/Scripts/python.exe scripts/sync_real_products.py

# ۴. سرور را اجرا کنید
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### ۴.۲. متغیرهای محیطی (.env)

```env
API_BASE_URL=https://your-ai-api.com/api/v1
API_KEY=your-api-key
LLM_MODEL=gemini-3.1-flash-lite-preview
QDRANT_URL=http://localhost:6333
EMBEDDING_PROVIDER=local
```

### ۴.۳. فرانت‌اند

```bash
npm run build
# فایل‌های build شده در پوشه out/ یا .next/ هستند
# آن‌ها را روی سرور وب خود آپلود کنید
```

### ۴.۴. Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    # فرانت‌اند
    location / {
        root /var/www/novabot-frontend;
        try_files $uri $uri/ /index.html;
    }

    # API بک‌اند
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

## ۵. APIهای بک‌اند

### ۵.۱. دریافت سبد محصول

```
POST /api/v1/recommend/basket
Content-Type: application/json

{
  "industry": "برنامه‌نویسی",
  "category": "developer-tools",
  "challenge": "بررسی کد",
  "budget": "paid"
}

Response:
{
  "basket_title": "عنوان سبد",
  "summary_reasoning": "توضیح",
  "selected_products": [...],
  "total_estimated_cost_range": "محدوده هزینه"
}
```

### ۵.۲. چت

```
POST /api/v1/chat
Content-Type: application/json

{
  "message": "درباره TaskFlow Pro توضیح بده",
  "session_id": "session-123",
  "basket_context": { ... }
}

Response:
{
  "message": "پاسخ فارسی...",
  "session_id": "session-123"
}
```

### ۵.۳. سلامت سرور

```
GET /

Response:
{
  "status": "ok",
  "service": "NovaBot AI"
}
```

---

## ۶. سوالات متداول

### سوال: چطور محصولات جدید را به Qdrant اضافه کنم؟
جواب: اسکریپت `sync_real_products.py` را اجرا کنید. این اسکریپت محصولات را از API شما دریافت و در Qdrant ذخیره می‌کند.

### سوال: آیا می‌توانم از مدل AI دیگری استفاده کنم؟
جواب: بله. مقدار `LLM_MODEL` در فایل `.env` را تغییر دهید. مدل‌های موجود: `deepseek-v4-flash`, `gemini-3.1-flash-lite-preview`, `gpt-5-mini`, `claude-3-5-haiku-20241022`.

### سوال: چطور Qdrant را در production استقرار دهم؟
جواب: از Qdrant Cloud استفاده کنید و `QDRANT_URL` در `.env` را به آدرس کلاуд تغییر دهید.

### سوال: آیا می‌توانم چت‌بات را بدون Qdrant اجرا کنم؟
جواب: خیر. Qdrant برای جستجوی برداری محصولات ضروری است. اما می‌توانید از نسخه کلاود رایگان Qdrant استفاده کنید.

### سوال: چطور چت‌بات را روی دامنه خودم استقرار دهم؟
جواب: فایل‌های فرانت‌اند را build کنید و روی سرور وب آپلود کنید. بک‌اند را با uvicorn یا gunicorn اجرا کنید و با Nginx reverse proxy متصل کنید.
