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
    from app.services.productplus import load_productplus_products

    products = load_productplus_products()
    print(f"Loaded {len(products)} products from ProductPlus {settings.productplus_access_mode}")
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
