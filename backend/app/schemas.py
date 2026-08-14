from pydantic import BaseModel


class QuizResponse(BaseModel):
    industry: str
    category: str
    challenge: str
    budget: str
    role: str = ""
    team_size: str = ""


class ProductItem(BaseModel):
    product_id: str
    title: str
    description: str
    category: str
    pricing_type: str
    sponsor_tier: int
    match_score: float = 0.0
    role_in_basket: str = ""
    is_featured: bool = False


class ProductBasket(BaseModel):
    basket_title: str
    summary_reasoning: str
    selected_products: list[ProductItem]
    total_estimated_cost_range: str


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    basket_context: ProductBasket | None = None


class ChatResponse(BaseModel):
    message: str
    session_id: str
