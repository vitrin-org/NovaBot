import ChatWidget from "@/components/ChatWidget";
import { BRAND } from "@/lib/config";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4" dir="rtl">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-gray-900">{BRAND.name}</h1>
        <p className="mt-4 text-lg text-gray-600">
          {BRAND.description}
        </p>
        <p className="mt-2 text-sm text-gray-400">
          روی آیکون چت در گوشه پایین کلیک کنید تا شروع کنید.
        </p>
      </div>
      <ChatWidget />
    </main>
  );
}
