from sentence_transformers import SentenceTransformer

print("Loading embedding model...")
_model = SentenceTransformer("intfloat/multilingual-e5-large")
print("Embedding model loaded.")


def embed(text: str) -> list[float]:
    return _model.encode(text).tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    return _model.encode(texts).tolist()
