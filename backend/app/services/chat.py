from collections import defaultdict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

from app.config import settings

CHAT_SYSTEM_PROMPT = """شما دستیار هوشمند {brand_name} هستید. به کاربران کمک می‌کنید بهترین ابزارهای دیجیتال و استارتاپ‌ها را برای نیازهایشان پیدا کنند.

وقتی کاربر سبد محصول فعالی دارد، از آن به عنوان زمینه برای پاسخ به سوالاتش درباره محصولات پیشنهادی استفاده کنید. مفید، مختصر و آگاهانه پاسخ دهید.

اگر کاربر درباره محصول خاصی سوال کرد، ویژگی‌ها، قیمت و دلیل مناسب بودن آن محصول را توضیح دهید.

قوانین مهم:
- همیشه و فقط به زبان فارسی پاسخ دهید.
- از هیچ زبان دیگری (انگلیسی، چینی، عربی و...) استفاده نکنید مگر نام خود محصولات.
- از Markdown برای ساختاربندی پاسخ استفاده کنید (عنوان، لیست، متن بولد)."""

sessions: dict[str, list] = defaultdict(list)


def get_chat_response(
    message: str,
    session_id: str = "default",
    basket_context: dict | None = None,
) -> str:
    llm = ChatOpenAI(
        model=settings.llm_model,
        temperature=0.7,
        api_key=settings.api_key,
        base_url=settings.api_base_url,
    )

    system_msg = CHAT_SYSTEM_PROMPT.format(brand_name=settings.brand_name)

    prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content=system_msg),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{input}"),
    ])

    history = sessions[session_id]

    if basket_context:
        basket_msg = f"سبد محصول فعال:\n{basket_context}"
        history.append(HumanMessage(content=basket_msg))
        history.append(AIMessage(content="سبد محصول را ذخیره کردم. آماده‌ام به سوالات شما درباره این پیشنهادات پاسخ دهم."))

    chain = prompt | llm
    result = chain.invoke({
        "history": history,
        "input": message,
    })

    history.append(HumanMessage(content=message))
    history.append(AIMessage(content=result.content))

    if len(history) > 20:
        sessions[session_id] = history[-20:]

    return result.content
