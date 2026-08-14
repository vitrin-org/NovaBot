from fastapi import APIRouter

from app.schemas import ProductBasket, ProductItem, QuizResponse
from app.services.basket import generate_basket
from app.services.recommender import get_hybrid_recommendations

router = APIRouter(prefix="/api/v1/recommend", tags=["recommend"])


def _build_filters(quiz: QuizResponse) -> dict:
    filters: dict = {}
    if quiz.category:
        filters["category"] = quiz.category
    if quiz.budget == "free":
        filters["pricing_type"] = "free"
    elif quiz.budget == "paid":
        filters["must_not"] = {"pricing_type": "free"}
    return filters


@router.post("", response_model=list[ProductItem])
async def recommend(quiz: QuizResponse):
    query = f"{quiz.industry} {quiz.challenge}"
    if quiz.role:
        query += f" role:{quiz.role}"
    if quiz.team_size:
        query += f" team_size:{quiz.team_size}"
    filters = _build_filters(quiz)
    return get_hybrid_recommendations(user_query=query, user_filters=filters)


@router.post("/basket", response_model=ProductBasket)
async def recommend_basket(quiz: QuizResponse):
    query = f"{quiz.industry} {quiz.challenge}"
    if quiz.role:
        query += f" role:{quiz.role}"
    if quiz.team_size:
        query += f" team_size:{quiz.team_size}"
    filters = _build_filters(quiz)
    recommendations = get_hybrid_recommendations(user_query=query, user_filters=filters)
    return generate_basket(
        quiz=quiz.model_dump(),
        recommendations=recommendations,
    )
