from sentence_transformers import SentenceTransformer
import httpx
from app.config import settings

if settings.embedding_provider == "openai":
    print("Using OpenAI embeddings...")
    def embed(text: str) -> list[float]:
        response = httpx.post(
            f"{settings.api_base_url}/embeddings",
            headers={"Authorization": f"Bearer {settings.api_key}"},
            json={"model": "text-embedding-3-small", "input": text},
            timeout=30
        )
        response.raise_for_status()
        return response.json()["data"][0]["embedding"]

    def embed_batch(texts: list[str]) -> list[list[float]]:
        response = httpx.post(
            f"{settings.api_base_url}/embeddings",
            headers={"Authorization": f"Bearer {settings.api_key}"},
            json={"model": "text-embedding-3-small", "input": texts},
            timeout=60
        )
        response.raise_for_status()
        return [d["embedding"] for d in response.json()["data"]]
else:
    print("Loading local embedding model...")
    _model = SentenceTransformer("intfloat/multilingual-e5-large")
    print("Embedding model loaded.")

    def embed(text: str) -> list[float]:
        return _model.encode(text).tolist()

    def embed_batch(texts: list[str]) -> list[list[float]]:
        return _model.encode(texts).tolist()
