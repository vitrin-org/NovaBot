import json

from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

from app.config import settings
from app.schemas import ProductBasket, ProductItem

basket_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """شما دستیار هوشمند {brand_name} هستید. فقط محصولاتی را از لیست زیر انتخاب کنید. هیچ محصولی را اختراع یا اضافه نکنید.

نیازهای کاربر را تحلیل کنید و ۲ تا ۴ محصول مکمل از لیست انتخاب کنید.

خروجی را به صورت JSON برگردانید با این ساختار:
{{
  "basket_title": "عنوان سبد به فارسی",
  "summary_reasoning": "توضیح کوتاه به فارسی",
  "selected_products": [
    {{
      "product_id": "id محصول از لیست",
      "title": "نام محصول از لیست",
      "description": "توضیح کوتاه به فارسی",
      "role_in_basket": "نقش در سبد به فارسی",
      "match_score": 0.85,
      "is_featured": true
    }}
  ],
  "total_estimated_cost_range": "محدوده هزینه به فارسی"
}}

قوانین:
1. حتماً از product_id و title دقیق لیست استفاده کنید.
2. فقط به زبان فارسی بنویسید.
3. فقط خروج JSON برگردانید، متن اضافی ننویسید.""",
    ),
    (
        "human",
        """نیازهای کاربر:
- صنعت: {industry}
- چالش اصلی: {challenge}
- محدوده بودجه: {budget}

محصولات موجود (فقط این‌ها را استفاده کنید):
{products}

بهترین ۲ تا ۴ محصول از لیست بالا را برای این کاربر انتخاب کنید.""",
    ),
])


def generate_basket(
    quiz: dict,
    recommendations: list[ProductItem],
) -> ProductBasket:
    llm = ChatOpenAI(
        model=settings.llm_model,
        temperature=0.3,
        api_key=settings.api_key,
        base_url=settings.api_base_url,
    )

    chain = basket_prompt | llm

    products_text = "\n".join(
        f"- product_id=\"{r.product_id}\" | title=\"{r.title}\" | category=\"{r.category}\" | "
        f"pricing=\"{r.pricing_type}\" | featured={r.is_featured} | match={r.match_score} | "
        f"description=\"{r.description}\""
        for r in recommendations
    )

    result = chain.invoke({
        "brand_name": settings.brand_name,
        "industry": quiz.get("industry", ""),
        "challenge": quiz.get("challenge", ""),
        "budget": quiz.get("budget", ""),
        "products": products_text,
    })

    raw = result.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    data = json.loads(raw)
    rec_map = {r.product_id: r for r in recommendations}

    selected = []
    for item in data.get("selected_products", []):
        orig = rec_map.get(item["product_id"])
        selected.append(
            ProductItem(
                product_id=item["product_id"],
                title=item["title"],
                description=item.get("description", "") or (orig.description if orig else ""),
                category=orig.category if orig else "",
                pricing_type=orig.pricing_type if orig else "",
                sponsor_tier=orig.sponsor_tier if orig else (3 if item.get("is_featured") else 0),
                match_score=item.get("match_score", 0.0),
                role_in_basket=item.get("role_in_basket", ""),
                is_featured=item.get("is_featured", False),
            )
        )

    return ProductBasket(
        basket_title=data.get("basket_title", ""),
        summary_reasoning=data.get("summary_reasoning", ""),
        selected_products=selected,
        total_estimated_cost_range=data.get("total_estimated_cost_range", ""),
    )
