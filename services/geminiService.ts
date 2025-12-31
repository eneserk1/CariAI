
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { BusinessState, ChatMessage } from "../types";
// @ts-ignore
import * as XLSX from 'xlsx';

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

  private async readFileContent(file: File): Promise<string> {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const csv = XLSX.utils.sheet_to_csv(firstSheet);
            resolve(`Excel Dosya İçeriği (CSV formatında):\n${csv}`);
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    } else {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }
  }

  private cleanNumberString(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    
    let str = String(val).trim();
    // Safety valve: truncate extremely long hallucinated strings
    if (str.length > 15) {
        str = str.substring(0, 15);
    }
    
    // Remove non-numeric chars except dot, comma, minus
    str = str.replace(/[^0-9.,-]/g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Number(num.toFixed(2));
  }

  async processMessage(message: string, currentState: BusinessState, history: ChatMessage[], file?: File) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const historyContext = history.map(h => `${h.role === 'user' ? 'Müşteri' : 'Asistan'}: ${h.content}`).join('\n');
    let promptText = `Sistem Verileri: ${JSON.stringify({ 
      customers: currentState.customers, 
      products: currentState.products 
    })}\n\nKonuşma Geçmişi:\n${historyContext}\n\nYeni Mesaj: ${message}`;

    const parts: any[] = [];

    if (file) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const base64Data = await this.fileToBase64(file);
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        });
        promptText += "\n\n(BELGE ANALİZİ: Belgedeki sayıları BASİT tut. Kesinlikle 'e-' gibi bilimsel notasyonlar üretme. Sadece rakam ve nokta kullan.)";
      } else {
        try {
          const textContent = await this.readFileContent(file);
          promptText += `\n\nEKLI DOSYA IÇERIĞI:\n${textContent}`;
        } catch (e) {
          console.error("Dosya okuma hatası:", e);
        }
      }
    }

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: { parts: parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking to reduce hallucination loops
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            intent: { type: Type.STRING },
            data: {
              type: Type.OBJECT,
              properties: {
                customerName: { type: Type.STRING },
                productName: { type: Type.STRING },
                quantity: { type: Type.STRING },
                price: { type: Type.STRING },
                insights: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      value: { type: Type.STRING },
                      description: { type: Type.STRING },
                      type: { type: Type.STRING },
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
      let rawText = response.text?.trim() || '{}';
      
      // PRE-PARSE SANITIZATION:
      // 1. Detect and truncate ridiculously long string values (hallucinations)
      // This regex looks for strings inside quotes that are excessively long
      rawText = rawText.replace(/"([^"]{100,})"/g, (match, p1) => {
          // If it looks like a numeric hallucination (lots of zeros or dots)
          if (/^[0-9.eE-]+$/.test(p1)) {
              return `"0"`; 
          }
          // If it's just a long string, keep first 50 chars
          return `"${p1.substring(0, 50)}..."`;
      });

      // 2. Fix potential truncation (if the model stops mid-JSON)
      if (rawText.lastIndexOf('}') < rawText.lastIndexOf('{')) {
          // Attempt to close JSON if it's truncated
          rawText += '"}'; 
      }

      // 3. Final regex for raw numbers just in case model ignored schema
      rawText = rawText.replace(/:\s*(-?\d+\.\d+e?-?\d*)/gi, (match, p1) => {
          if (p1.length > 15 || p1.includes('e')) {
              return `: "0"`;
          }
          return match;
      });

      const parsed = JSON.parse(rawText);

      if (parsed.data) {
        parsed.data.quantity = this.cleanNumberString(parsed.data.quantity);
        parsed.data.price = this.cleanNumberString(parsed.data.price);
      }

      return parsed;
    } catch (e) {
      console.error('Gemini JSON Parse Hatası:', e);
      // Fallback for extreme cases
      return { 
        message: "Belgedeki veriler işlenirken bir teknik hata oluştu. Lütfen miktar ve tutarı elle belirterek tekrar deneyin.", 
        intent: 'GENERAL_CHAT' 
      };
    }
  }
}

export const geminiService = new GeminiService();
