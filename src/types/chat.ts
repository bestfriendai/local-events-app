export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  events?: any[];
}

export type AIService = 'perplexity' | 'claude';