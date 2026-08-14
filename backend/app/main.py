from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import chat, recommend
from app.fundraising.routers import fundraising

app = FastAPI(title=f"{settings.brand_name} AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3004", "http://127.0.0.1:3004"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend.router)
app.include_router(chat.router)
app.include_router(fundraising.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": f"{settings.brand_name} AI"}
