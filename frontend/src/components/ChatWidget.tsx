"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, ProductBasket, QuizData } from "@/lib/types";
import { recommendBasket, sendMessage } from "@/lib/api";
import { BRAND } from "@/lib/config";
import OnboardingQuiz from "./OnboardingQuiz";
import BasketDisplay from "./BasketDisplay";
import ChatMessageComponent from "./ChatMessage";

type ChatPhase = "quiz" | "basket" | "chat";

interface Session {
  id: string;
  phase: ChatPhase;
  basket: ProductBasket | null;
  messages: ChatMessage[];
  title: string;
  timestamp: number;
}

const STORAGE_KEY = "digiyar_sessions";
const MAX_SESSIONS = 5;

function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveSessions(sessions: Session[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
}

function makeTitle(basket: ProductBasket | null, messages: ChatMessage[]): string {
  if (basket?.basket_title) return basket.basket_title;
  const firstUser = messages.find((m) => m.role === "user");
  if (firstUser) return firstUser.content.slice(0, 30) + (firstUser.content.length > 30 ? "..." : "");
  return "گفتگوی جدید";
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<ChatPhase>("quiz");
  const [basket, setBasket] = useState<ProductBasket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save current session to sessions list
  const persistSession = (phase: ChatPhase, basket: ProductBasket | null, messages: ChatMessage[], sessionId: string) => {
    const allSessions = loadSessions();
    const title = makeTitle(basket, messages);
    const existing = allSessions.findIndex((s) => s.id === sessionId);

    const session: Session = {
      id: sessionId,
      phase,
      basket,
      messages,
      title,
      timestamp: Date.now(),
    };

    let updated: Session[];
    if (existing >= 0) {
      updated = [...allSessions];
      updated[existing] = session;
    } else {
      updated = [session, ...allSessions];
    }

    // Keep only last 5
    updated = updated.slice(0, MAX_SESSIONS);
    saveSessions(updated);
    setSessions(updated);
  };

  // Save whenever state changes
  useEffect(() => {
    if (!ready || !currentSessionId) return;
    persistSession(phase, basket, messages, currentSessionId);
  }, [phase, basket, messages, ready, currentSessionId]);

  const handleOpen = () => {
    const savedSessions = loadSessions();
    setSessions(savedSessions);

    // Load last session
    if (savedSessions.length > 0) {
      const last = savedSessions[0];
      setPhase(last.phase);
      setBasket(last.basket);
      setMessages(last.messages);
      setCurrentSessionId(last.id);
    } else {
      setPhase("quiz");
      setBasket(null);
      setMessages([]);
      setCurrentSessionId(Date.now().toString());
    }

    setReady(true);
    setIsOpen(true);
    setShowHistory(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleNewSession = () => {
    // Save current session before creating new one
    if (currentSessionId && messages.length > 0) {
      persistSession(phase, basket, messages, currentSessionId);
    }
    setPhase("quiz");
    setBasket(null);
    setMessages([]);
    setCurrentSessionId(Date.now().toString());
    setShowHistory(false);
  };

  const handleLoadSession = (session: Session) => {
    setPhase(session.phase);
    setBasket(session.basket);
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  const handleDeleteSession = (id: string) => {
    const allSessions = loadSessions().filter((s) => s.id !== id);
    saveSessions(allSessions);
    setSessions(allSessions);
    // If we deleted the current session, start new
    if (id === currentSessionId) {
      handleNewSession();
    }
  };

  const handleQuizComplete = async (quiz: QuizData) => {
    setLoading(true);
    try {
      const result = await recommendBasket(quiz);
      setBasket(result);
      setPhase("basket");
      setMessages([
        {
          role: "assistant",
          content: `این پیشنهادات شخصی شما هستند! من ${result.selected_products.length} ابزار متناسب با نیازهایتان انتخاب کردم. هر سوالی دارید بپرسید.`,
        },
      ]);
    } catch (err) {
      setMessages([
        { role: "assistant", content: "متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (productId: string, feedback: "up" | "down") => {
    console.log("Feedback:", productId, feedback);
    // TODO: send to API
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const reply = await sendMessage(userMsg, "default", basket || undefined);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "متأسفانه نتوانستم پردازش کنم. دوباره تلاش کنید." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="تاریخچه گفتگوها"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={handleNewSession}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="گفتگوی جدید"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <div>
            <h3 className="font-semibold text-gray-900">{BRAND.nameFa}</h3>
            <p className="text-xs text-gray-500">{BRAND.description}</p>
          </div>
        </div>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="border-b border-gray-100 bg-gray-50 p-3">
          <p className="mb-2 text-xs font-medium text-gray-500">تاریخچه گفتگوها</p>
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-400">گفتگویی ذخیره نشده</p>
          ) : (
            <div className="max-h-40 space-y-1.5 overflow-y-auto">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    s.id === currentSessionId
                      ? "bg-primary-50 text-primary-700"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  } cursor-pointer`}
                >
                  <span
                    className="flex-1 truncate"
                    onClick={() => handleLoadSession(s)}
                  >
                    {s.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(s.id);
                    }}
                    className="mr-2 text-gray-400 hover:text-red-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {phase === "quiz" && <OnboardingQuiz onComplete={handleQuizComplete} />}

        {phase === "basket" && basket && (
          <BasketDisplay basket={basket} onFeedback={handleFeedback} />
        )}

        {messages.map((msg, i) => (
          <div key={i} className="mb-3">
            <ChatMessageComponent message={msg} />
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500">
              در حال پردازش...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {phase === "basket" && (
        <div className="border-t border-gray-100 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="درباره پیشنهادات سوال بپرسید..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
              dir="rtl"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              ارسال
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
