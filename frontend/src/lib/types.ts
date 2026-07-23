export interface QuizData {
  industry: string;
  challenge: string;
  budget: string;
}

export interface ProductItem {
  product_id: string;
  title: string;
  description: string;
  category: string;
  pricing_type: string;
  sponsor_tier: number;
  match_score: number;
  role_in_basket: string;
  is_featured: boolean;
}

export interface ProductBasket {
  basket_title: string;
  summary_reasoning: string;
  selected_products: ProductItem[];
  total_estimated_cost_range: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
