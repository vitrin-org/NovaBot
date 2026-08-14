import httpx
import psycopg2

from app.config import settings
from app.productplus_config import CATEGORY_MAP, SPONSOR_TIER_FROM_STATUS


def _normalize_project(project: dict) -> dict:
    project_id = project.get("id") or project.get("project_id")
    title = project.get("title") or project.get("name") or ""
    summary = project.get("summary") or project.get("description") or ""
    description = project.get("description") or project.get("full_description") or summary

    category_slug = (
        project.get("category_slug")
        or project.get("project_category_slug")
        or project.get("category")
        or "startup"
    )
    if isinstance(category_slug, dict):
        category_slug = category_slug.get("slug") or category_slug.get("name") or "startup"
    if isinstance(category_slug, list):
        category_slug = category_slug[0] if category_slug else "startup"

    status = project.get("status") or "published"
    is_featured = bool(project.get("is_featured") or project.get("featured"))
    sponsor_tier = SPONSOR_TIER_FROM_STATUS.get(status, 0)
    if is_featured and status == "published":
        sponsor_tier = max(sponsor_tier, 3)

    funding = project.get("funding_required") or project.get("price") or 0
    try:
        funding = int(funding)
    except (TypeError, ValueError):
        funding = 0

    mapped_category = CATEGORY_MAP.get(str(category_slug), str(category_slug))
    pricing_type = "subscription" if funding else "free"

    return {
        "product_id": f"pp-{project_id}",
        "name": title,
        "summary": summary,
        "full_description": description,
        "categories": [mapped_category],
        "sponsor_tier": sponsor_tier,
        "pricing_type": pricing_type,
        "target_audience": project.get("investor_profile") or project.get("target_audience") or "startups",
        "productplus_metadata": {
            "project_id": project_id,
            "slug": project.get("slug"),
            "stage": project.get("stage"),
            "status": status,
            "funding_required": funding,
            "source": project.get("source") or "productplus",
        },
    }


def load_products_from_db() -> list[dict]:
    conn = psycopg2.connect(
        host=settings.productplus_host,
        port=settings.productplus_port,
        dbname=settings.productplus_db,
        user=settings.productplus_user,
        password=settings.productplus_password,
    )
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT p.id, p.title, p.slug, p.summary, p.description,
                   pc.slug AS category_slug,
                   p.funding_required, p.investor_profile,
                   p.stage, p.status, p.is_featured
            FROM projects p
            LEFT JOIN project_categories pc ON p.project_category_id = pc.id
            WHERE p.status IN ('published', 'scheduled')
            ORDER BY p.is_featured DESC, p.created_at DESC
        """)
        rows = cur.fetchall()
    finally:
        conn.close()

    products = []
    for row in rows:
        (
            project_id,
            title,
            slug,
            summary,
            description,
            category_slug,
            funding_required,
            investor_profile,
            stage,
            status,
            is_featured,
        ) = row
        products.append(
            _normalize_project({
                "id": project_id,
                "title": title,
                "slug": slug,
                "summary": summary,
                "description": description,
                "category_slug": category_slug,
                "funding_required": funding_required,
                "investor_profile": investor_profile,
                "stage": stage,
                "status": status,
                "is_featured": is_featured,
                "source": "productplus-db",
            })
        )
    return products


def load_products_from_api() -> list[dict]:
    headers = {}
    if settings.productplus_api_key:
        headers["Authorization"] = f"Bearer {settings.productplus_api_key}"

    with httpx.Client(timeout=settings.productplus_api_timeout) as client:
        response = client.get(settings.productplus_api_url, headers=headers)
        response.raise_for_status()
        payload = response.json()

    if isinstance(payload, dict):
        items = payload.get("results") or payload.get("data") or payload.get("items") or []
    else:
        items = payload

    return [
        _normalize_project({**item, "source": "productplus-api"})
        for item in items
        if item.get("id") or item.get("project_id")
    ]


def load_productplus_products() -> list[dict]:
    if settings.productplus_access_mode == "api":
        return load_products_from_api()
    return load_products_from_db()
