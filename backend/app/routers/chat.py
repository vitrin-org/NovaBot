from fastapi import APIRouter

from app.schemas import ChatRequest, ChatResponse
from app.services.chat import get_chat_response

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    basket_dict = req.basket_context.model_dump() if req.basket_context else None
    response = get_chat_response(
        message=req.message,
        session_id=req.session_id,
        basket_context=basket_dict,
    )
    return ChatResponse(message=response, session_id=req.session_id)
