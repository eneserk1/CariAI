
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { BusinessState, ChatMessage } from "../types";

export class GeminiService {
  
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private cleanNumberString(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Virgüllü sayıları noktaya çevir ve temizle
    let str = String(val).trim().replace(/[^0-9.,-]/g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Number(num.toFixed(2));
  }

  async processMessageStream(message: string, currentState: BusinessState, history: ChatMessage[], file?: File, onChunk?: (text: string) => void) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Bağlamı (Context) daraltarak hızı artırıyoruz
    let contextData = { 
      c: currentState.customers.map(c => ({n: c.name, b: c.balance})), 
      p: currentState.products.map(p => ({n: p.name, s: p.stockCount}))
    };

    let promptText = `BAĞLAM: ${JSON.stringify(contextData)}\nKULLANICI: ${message}`;

    const parts: any[] = [];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      const base64Data = await this.fileToBase64(file);
      parts.push({ inlineData: { mimeType: file.type, data: base64Data } });
    }
    parts.push({ text: promptText });

    const result = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    let fullText = "";
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        if (onChunk) onChunk(fullText);
      }
    }

    try {
      // JSON bloklarını temizle (```json ... ```)
      const cleanJson = fullText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      if (parsed.data) {
        if (parsed.data.quantity) parsed.data.quantity = this.cleanNumberString(parsed.data.quantity);
        if (parsed.data.price) parsed.data.price = this.cleanNumberString(parsed.data.price);
      }
      return parsed;
    } catch (e) {
      console.error("JSON Parse Hatası. Ham metin:", fullText);
      // Fallback: If it's not JSON, maybe it's just general chat
      return { message: fullText || "Anlayamadım, lütfen tekrar dener misin?", intent: "GENERAL_CHAT" };
    }
  }

  async processMessage(message: string, currentState: BusinessState, history: ChatMessage[], file?: File) {
      return this.processMessageStream(message, currentState, history, file);
  }
}

export const geminiService = new GeminiService();
