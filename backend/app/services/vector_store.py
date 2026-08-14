import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

from app.config import settings
from app.services.embedding import embed

COLLECTION_NAME = "product_plus_services"
VECTOR_DIM = 1024


class VectorStore:
    def __init__(self):
        self.client = QdrantClient(url=settings.qdrant_url)

    def create_collection(self):
        collections = self.client.get_collections().collections
        existing = [c.name for c in collections]
        if COLLECTION_NAME not in existing:
            self.client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=VECTOR_DIM,
                    distance=Distance.COSINE,
                ),
            )

    def upsert_products(self, products: list[dict]):
        points = []
        for p in products:
            text = f"{p['name']} {p.get('summary', '')} {p.get('full_description', '')}"
            vector = embed(text)
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, p["product_id"]))
            payload = {
                "product_id": p["product_id"],
                "name": p["name"],
                "summary": p.get("summary", ""),
                "full_description": p.get("full_description", ""),
                "categories": p.get("categories", []),
                "sponsor_tier": p.get("sponsor_tier", 0),
                "pricing_type": p.get("pricing_type", "free"),
                "target_audience": p.get("target_audience", ""),
            }
            if "productplus_metadata" in p:
                payload["productplus_metadata"] = p["productplus_metadata"]
            if "source" in p:
                payload["source"] = p["source"]
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload,
                )
            )
        self.client.upsert(collection_name=COLLECTION_NAME, points=points)

    def search(
        self,
        query_embedding: list[float],
        filters: dict | None = None,
        top_k: int = 15,
    ) -> list[dict]:
        query_filter = None
        if filters:
            must_conditions = []
            if filters.get("category"):
                must_conditions.append(
                    FieldCondition(
                        key="categories",
                        match=MatchValue(value=filters["category"]),
                    )
                )
            if filters.get("pricing_type"):
                must_conditions.append(
                    FieldCondition(
                        key="pricing_type",
                        match=MatchValue(value=filters["pricing_type"]),
                    )
                )

            must_not_conditions = []
            if filters.get("must_not"):
                for key, value in filters["must_not"].items():
                    must_not_conditions.append(
                        FieldCondition(
                            key=key,
                            match=MatchValue(value=value),
                        )
                    )

            if must_conditions or must_not_conditions:
                query_filter = Filter(must=must_conditions, must_not=must_not_conditions)

        results = self.client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_embedding,
            query_filter=query_filter,
            limit=top_k,
        )

        return [
            {
                "product_id": r.payload["product_id"],
                "name": r.payload["name"],
                "summary": r.payload["summary"],
                "full_description": r.payload["full_description"],
                "categories": r.payload["categories"],
                "sponsor_tier": r.payload["sponsor_tier"],
                "pricing_type": r.payload["pricing_type"],
                "target_audience": r.payload["target_audience"],
                "cosine_similarity": r.score,
            }
            for r in results.points
        ]


vector_store = VectorStore()
