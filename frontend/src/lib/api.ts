import { ChatMessage, ProductBasket, QuizData } from "./types";

const API_BASE = "http://localhost:8000/api/v1";

export async function recommendBasket(quiz: QuizData): Promise<ProductBasket> {
  const res = await fetch(`${API_BASE}/recommend/basket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quiz),
  });
  if (!res.ok) throw new Error("Failed to get recommendations");
  return res.json();
}

export async function sendMessage(
  message: string,
  sessionId: string,
  basket?: ProductBasket
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      basket_context: basket || null,
    }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  const data = await res.json();
  return data.message;
}
