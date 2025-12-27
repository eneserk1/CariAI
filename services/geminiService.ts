
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { BusinessState, ChatMessage } from "../types";

export class GeminiService {
  async processMessage(message: string, currentState: BusinessState, history: ChatMessage[]) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const historyContext = history.map(h => `${h.role === 'user' ? 'Müşteri' : 'Asistan'}: ${h.content}`).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Sistem Verileri: ${JSON.stringify({ 
        customers: currentState.customers, 
        products: currentState.products 
      })}\n\nKonuşma Geçmişi:\n${historyContext}\n\nYeni Mesaj: ${message}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 }, // Enable reasoning for high quality business insights
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING, description: 'Kullanıcıya gösterilecek asıl yanıt.' },
            intent: { type: Type.STRING, description: 'SALE_RECORD, PURCHASE_RECORD, DASHBOARD_INSIGHT veya GENERAL_CHAT.' },
            data: {
              type: Type.OBJECT,
              properties: {
                customerName: { type: Type.STRING },
                productName: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                price: { type: Type.NUMBER },
                insights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      value: { type: Type.STRING },
                      description: { type: Type.STRING },
                      type: { type: Type.STRING, description: 'positive, negative, neutral, info' },
                      icon: { type: Type.STRING }
                    },
                    required: ['id', 'title', 'value', 'description', 'type']
                  }
                }
              }
            }
          },
          required: ['message', 'intent']
        }
      },
    });

    try {
      const text = response.text?.trim() || '{}';
      return JSON.parse(text);
    } catch (e) {
      console.error('Gemini JSON Parse Hatası:', e);
      return { message: response.text, intent: 'GENERAL_CHAT' };
    }
  }
}

export const geminiService = new GeminiService();
