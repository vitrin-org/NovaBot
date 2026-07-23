from app.schemas import ProductItem
from app.services.embedding import embed
from app.services.vector_store import vector_store

SPONSOR_WEIGHT_MAP = {0: 0.0, 1: 0.3, 2: 0.6, 3: 1.0}
SEMANTIC_WEIGHT = 0.65
SPONSOR_WEIGHT = 0.35
SIMILARITY_THRESHOLD = 0.45


def get_hybrid_recommendations(
    user_query: str,
    user_filters: dict | None = None,
    top_k: int = 5,
) -> list[ProductItem]:
    query_embedding = embed(user_query)

    candidates = vector_store.search(
        query_embedding=query_embedding,
        filters=user_filters,
        top_k=15,
    )

    scored = []
    for c in candidates:
        similarity = c["cosine_similarity"]
        if similarity < SIMILARITY_THRESHOLD:
            continue

        sponsor_weight = SPONSOR_WEIGHT_MAP.get(c["sponsor_tier"], 0.0)
        final_score = (similarity * SEMANTIC_WEIGHT) + (sponsor_weight * SPONSOR_WEIGHT)

        scored.append(
            ProductItem(
                product_id=c["product_id"],
                title=c["name"],
                description=c["summary"],
                category=c["categories"][0] if c["categories"] else "",
                pricing_type=c["pricing_type"],
                sponsor_tier=c["sponsor_tier"],
                match_score=round(final_score, 3),
                is_featured=c["sponsor_tier"] >= 2,
            )
        )

    scored.sort(key=lambda x: x.match_score, reverse=True)
    return scored[:top_k]
