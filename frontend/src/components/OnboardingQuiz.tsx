"use client";

import { useState } from "react";
import { QuizData } from "@/lib/types";

interface OnboardingQuizProps {
  onComplete: (quiz: QuizData) => void;
}

const INDUSTRIES = [
  { label: "فروشگاه آنلاین", category: "e-commerce" },
  { label: "نرم‌افزار (SaaS)", category: "product-management" },
  { label: "بازاریابی", category: "marketing" },
  { label: "برنامه‌نویسی", category: "developer-tools" },
  { label: "طراحی", category: "design" },
  { label: "مالی و حسابداری", category: "fintech" },
  { label: "سلامت", category: "healthcare" },
  { label: "آموزش", category: "education" },
];

const ROLES = [
  { label: "موسس / تبلیغات", value: "founder" },
  { label: "مدیر محصول", value: "product-manager" },
  { label: "مهندس / توسعه‌دهنده", value: "engineer" },
  { label: "عملیات / فروش", value: "operations" },
  { label: "مالی / حسابداری", value: "finance" },
  { label: "سایر", value: "other" },
];

const TEAM_SIZES = [
  { label: "۱-۵ نفر", value: "1-5" },
  { label: "۶-۲۰ نفر", value: "6-20" },
  { label: "۲۱-۱۰۰ نفر", value: "21-100" },
  { label: "۱۰۰+ نفر", value: "100+" },
];

export default function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const [step, setStep] = useState(0);
  const [quiz, setQuiz] = useState<QuizData>({
    industry: "",
    category: "",
    challenge: "",
    budget: "free",
    role: "",
    team_size: "",
  });

  const handleNext = () => setStep((s) => s + 1);

  const handleSubmit = () => onComplete(quiz);

  return (
    <div className="space-y-4" dir="rtl">
      {step === 0 && (
        <>
          <p className="font-medium text-gray-900">حوزه کاری شما چیست؟</p>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.label}
                onClick={() => {
                  setQuiz({ ...quiz, industry: ind.label, category: ind.category });
                  handleNext();
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  quiz.industry === ind.label
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <p className="font-medium text-gray-900">چالش اصلی شما چیست؟</p>
          <textarea
            value={quiz.challenge}
            onChange={(e) => setQuiz({ ...quiz, challenge: e.target.value })}
            placeholder="مثلاً: نیاز به ابزار مدیریت پروژه بهتر برای تیم ریموت..."
            className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-primary-500 focus:outline-none"
            rows={3}
          />
          <button
            onClick={handleNext}
            disabled={!quiz.challenge.trim()}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            بعدی
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="font-medium text-gray-900">نقش شما چیست؟</p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => {
                  setQuiz({ ...quiz, role: r.value });
                  handleNext();
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  quiz.role === r.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <p className="font-medium text-gray-900">اندازه تیم شما چقدر است؟</p>
          <div className="flex flex-wrap gap-2">
            {TEAM_SIZES.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setQuiz({ ...quiz, team_size: t.value });
                  handleNext();
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  quiz.team_size === t.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <p className="font-medium text-gray-900">چه بودجه‌ای دارید؟</p>
          <div className="flex gap-2">
            <button
              onClick={() => setQuiz({ ...quiz, budget: "free" })}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                quiz.budget === "free"
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              رایگان
            </button>
            <button
              onClick={() => setQuiz({ ...quiz, budget: "paid" })}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                quiz.budget === "paid"
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              پرداختی
            </button>
          </div>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            دریافت پیشنهادات
          </button>
        </>
      )}
    </div>
  );
}
