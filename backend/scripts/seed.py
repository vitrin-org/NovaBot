import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.vector_store import vector_store


def main():
    data_path = Path(__file__).resolve().parent.parent / "app" / "mock_data" / "products.json"
    with open(data_path) as f:
        products = json.load(f)

    print(f"Creating collection...")
    vector_store.create_collection()

    print(f"Upserting {len(products)} products...")
    vector_store.upsert_products(products)

    print("Done.")


if __name__ == "__main__":
    main()
