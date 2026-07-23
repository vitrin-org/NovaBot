from fastapi import APIRouter

from app.schemas import ProductBasket, ProductItem, QuizResponse
from app.services.basket import generate_basket
from app.services.recommender import get_hybrid_recommendations

router = APIRouter(prefix="/api/v1/recommend", tags=["recommend"])


@router.post("", response_model=list[ProductItem])
async def recommend(quiz: QuizResponse):
    query = f"{quiz.industry} {quiz.challenge} {quiz.budget}"
    return get_hybrid_recommendations(user_query=query, user_filters=None)


@router.post("/basket", response_model=ProductBasket)
async def recommend_basket(quiz: QuizResponse):
    query = f"{quiz.industry} {quiz.challenge} {quiz.budget}"
    recommendations = get_hybrid_recommendations(user_query=query, user_filters=None)
    return generate_basket(
        quiz=quiz.model_dump(),
        recommendations=recommendations,
    )
