"use client";

import { ProductBasket } from "@/lib/types";
import ProductCard from "./ProductCard";

interface BasketDisplayProps {
  basket: ProductBasket;
}

export default function BasketDisplay({ basket }: BasketDisplayProps) {
  return (
    <div className="space-y-4" dir="rtl">
      <div className="rounded-xl bg-gradient-to-bl from-primary-50 to-white p-4">
        <h2 className="text-base font-bold text-gray-900">{basket.basket_title}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
          {basket.summary_reasoning}
        </p>
      </div>

      <div className="space-y-3">
        {basket.selected_products.map((product) => (
          <ProductCard key={product.product_id} product={product} />
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
        <span className="text-xs text-gray-500">هزینه تقریبی</span>
        <span className="text-sm font-semibold text-gray-700">
          {basket.total_estimated_cost_range}
        </span>
      </div>
    </div>
  );
}
