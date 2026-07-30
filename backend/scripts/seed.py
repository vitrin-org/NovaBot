import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.services.vector_store import vector_store


def seed_from_mock():
    data_path = Path(__file__).resolve().parent.parent / "app" / "mock_data" / "products.json"
    with open(data_path) as f:
        products = json.load(f)
    print(f"Loading {len(products)} products from mock data")
    return products


def seed_from_productplus():
    import psycopg2
    from app.productplus_config import CATEGORY_MAP, BUDGET_TIER_MAP, STATUS_MAP, SPONSOR_TIER_FROM_STATUS

    conn = psycopg2.connect(
        host=settings.productplus_host,
        port=settings.productplus_port,
        dbname=settings.productplus_db,
        user=settings.productplus_user,
        password=settings.productplus_password,
    )
    cur = conn.cursor()

    cur.execute("""
        SELECT p.id, p.title, p.slug, p.summary, p.description,
               pc.slug AS category_slug,
               p.funding_required, p.investor_profile,
               p.stage, p.status, p.is_featured
        FROM projects p
        LEFT JOIN project_categories pc ON p.project_category_id = pc.id
        WHERE p.status IN ('published', 'scheduled')
        ORDER BY p.created_at DESC
    """)

    rows = cur.fetchall()
    cur.close()
    conn.close()

    products = []
    for row in rows:
        pid, title, slug, summary, description, cat_slug, funding, investor, stage, status, is_featured = row

        budget_tier = BUDGET_TIER_MAP.get(2 if funding and funding > 2000000000 else 1, 0)
        if funding and funding >= 20000000000:
            budget_tier = 3
        elif funding and funding >= 8000000000:
            budget_tier = 2
        elif funding and funding >= 3000000000:
            budget_tier = 1

        sponsor_tier = SPONSOR_TIER_FROM_STATUS.get(status, 0)
        if is_featured and status == 'published':
            sponsor_tier = max(sponsor_tier, 3)

        categories = [cat_slug] if cat_slug else ['startup']
        mapped_categories = [CATEGORY_MAP.get(c, c) for c in categories]

        products.append({
            'product_id': f'pp-{pid}',
            'name': title,
            'summary': summary or '',
            'full_description': description or '',
            'categories': mapped_categories,
            'budget_tier': budget_tier,
            'sponsor_tier': sponsor_tier,
            'pricing_type': 'subscription',
            'target_audience': investor or 'startups',
            'productplus_metadata': {
                'project_id': pid,
                'slug': slug,
                'stage': stage,
                'status': status,
                'funding_required': funding,
                'source': 'productplus-db',
            },
        })

    print(f"Loaded {len(products)} products from ProductPlus DB")
    return products


def main():
    if settings.data_source == "productplus":
        print("Using ProductPlus database as data source...")
        products = seed_from_productplus()
    else:
        print("Using mock data as data source...")
        products = seed_from_mock()

    print(f"Creating collection...")
    vector_store.create_collection()

    print(f"Upserting {len(products)} products...")
    vector_store.upsert_products(products)

    out_path = Path(__file__).resolve().parent.parent / "db" / "current_products.json"
    out_path.parent.mkdir(exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print(f"Saved current products to {out_path}")
    print("Done.")


if __name__ == "__main__":
    main()
