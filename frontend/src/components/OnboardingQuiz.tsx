"use client";

import { useState } from "react";
import { QuizData } from "@/lib/types";

interface OnboardingQuizProps {
  onComplete: (quiz: QuizData) => void;
}

const INDUSTRIES = [
  "فروشگاه آنلاین",
  "نرم‌افزار (SaaS)",
  "بازاریابی",
  "برنامه‌نویسی",
  "طراحی",
  "مالی و حسابداری",
  "سلامت",
  "آموزش",
];

const BUDGETS = [
  "رایگان",
  "کمتر از ۲ میلیون تومان",
  "۲ تا ۸ میلیون تومان",
  "۸ تا ۲۰ میلیون تومان",
  "بیشتر از ۲۰ میلیون تومان",
];

export default function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const [step, setStep] = useState(0);
  const [quiz, setQuiz] = useState<QuizData>({
    industry: "",
    challenge: "",
    budget: "",
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
                key={ind}
                onClick={() => {
                  setQuiz({ ...quiz, industry: ind });
                  handleNext();
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  quiz.industry === ind
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {ind}
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
          <p className="font-medium text-gray-900">محدوده بودجه شما چقدر است؟</p>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setQuiz({ ...quiz, budget: b });
                }}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  quiz.budget === b
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!quiz.budget}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            دریافت پیشنهادات
          </button>
        </>
      )}
    </div>
  );
}
