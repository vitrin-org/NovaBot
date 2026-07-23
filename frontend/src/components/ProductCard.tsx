"use client";

import { ProductItem } from "@/lib/types";

interface ProductCardProps {
  product: ProductItem;
}

const CATEGORY_LABELS: Record<string, string> = {
  "project-management": "مدیریت پروژه",
  productivity: "بهره‌وری",
  devops: "دواپس",
  cloud: "cloud",
  analytics: "تحلیل داده",
  "business-intelligence": "هوش تجاری",
  security: "امنیت",
  "no-code": "بدون کد",
  "customer-support": "پشتیبانی مشتری",
  ai: "هوش مصنوعی",
  "data-integration": "یکپارچه‌سازی داده",
  etl: "ETL",
  design: "طراحی",
  collaboration: "همکاری",
  fintech: "فینتک",
  billing: "صورتحساب",
  "developer-tools": "ابزار توسعه",
  "code-quality": "کیفیت کد",
  marketing: "بازاریابی",
  email: "ایمیل",
  api: "API",
  infrastructure: "زیرساخت",
  testing: "تست",
  qa: "کیفیت",
  "product-management": "مدیریت محصول",
  "customer-feedback": "بازخورد مشتری",
  accounting: "حسابداری",
  content: "محتوا",
  "e-commerce": "فروشگاه آنلاین",
};

export default function ProductCard({ product }: ProductCardProps) {
  const categoryLabel = CATEGORY_LABELS[product.category] || product.category;

  return (
    <div
      className={`relative rounded-xl border-2 p-4 transition-all hover:shadow-md ${
        product.is_featured
          ? "border-amber-300 bg-gradient-to-bl from-amber-50 to-white"
          : "border-gray-100 bg-white hover:border-gray-200"
      }`}
      dir="rtl"
    >
      {product.is_featured && (
        <div className="mb-2 inline-block rounded-full bg-amber-400 px-3 py-0.5 text-[11px] font-bold text-amber-900 shadow-sm">
          پیشنهاد ویژه
        </div>
      )}

      <div className="mb-2 text-lg font-bold leading-tight text-gray-900">
        {product.title}
      </div>

      {product.role_in_basket && (
        <div className="mb-3 inline-block rounded-md bg-primary-50 px-2 py-0.5 text-[12px] font-medium text-primary-700">
          {product.role_in_basket}
        </div>
      )}

      {product.description && (
        <p className="mb-3 line-clamp-2 text-[13px] leading-relaxed text-gray-500">
          {product.description}
        </p>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
          {categoryLabel}
        </span>
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
          {product.pricing_type}
        </span>
      </div>

      <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-primary-500"
            style={{ width: `${Math.round(product.match_score * 100)}%` }}
          />
        </div>
        <span className="text-[11px] font-medium text-gray-500">
          {Math.round(product.match_score * 100)}٪
        </span>
      </div>
    </div>
  );
}
