
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, BusinessState } from '../types';
import { geminiService } from '../services/geminiService';
import DraftCard from './DraftCard';

interface ChatInterfaceProps {
  state: BusinessState;
  onUpdateState: (userMessage: string, intent: string, data: any, message: string, isDraft: boolean) => void;
  onAddUserMessage: (msg: string) => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onConfirmDraft: (messageId: number) => void;
  initialValue?: string;
  isPopup?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ state, onUpdateState, onAddUserMessage, onNewChat, onSelectChat, onConfirmDraft, initialValue = '', isPopup = false }) => {
  const [input, setInput] = useState(initialValue);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentChat = state.chatSessions.find(s => s.id === state.currentChatId) || state.chatSessions[0];

  useEffect(() => {
    if (initialValue) setInput(initialValue);
    if (!isPopup && window.innerWidth > 768) inputRef.current?.focus();
  }, [initialValue, isPopup]);

  useEffect(() => {
    if (scrollRef.current && currentChat) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChat?.messages, isTyping, selectedFile, streamingText]);

  const handleSend = async () => {
    if (!currentChat || (!input.trim() && !selectedFile) || isTyping) return;

    const userInput = input;
    const currentFile = selectedFile;
    
    setInput('');
    setSelectedFile(null);
    setIsTyping(true);
    setStreamingText("Düşünüyorum...");
    
    onAddUserMessage(currentFile ? `${userInput} [📎 ${currentFile.name}]` : userInput);

    try {
      const response = await geminiService.processMessageStream(
          userInput, 
          state, 
          currentChat.messages, 
          currentFile || undefined,
          (fullText) => {
              setStreamingText("Verileri işliyorum...");
          }
      );

      const draftIntents = ['SALE_RECORD', 'PURCHASE_RECORD', 'COLLECTION_RECORD', 'CUSTOMER_ADD', 'CUSTOMER_DELETE', 'PRODUCT_ADD', 'STOCK_ADJUST'];
      const isDraft = draftIntents.includes(response.intent);
      
      onUpdateState(
        '', 
        response.intent || 'GENERAL_CHAT', 
        { ...response.data, intent: response.intent }, 
        response.message || response.text || "İşlem hazır.",
        isDraft
      );
    } catch (error) {
      onUpdateState('', 'GENERAL_CHAT', {}, "Bir hata oluştu.", false);
    } finally {
      setIsTyping(false);
      setStreamingText("");
    }
  };

  if (!currentChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </div>
        <p className="font-black uppercase tracking-widest text-xs">Sohbet Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full bg-[#FBFBFD] dark:bg-slate-950 md:bg-white dark:md:bg-slate-900 overflow-hidden ${isPopup ? 'rounded-[32px]' : ''}`}>
      <div className="flex-1 flex flex-col h-full relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            {currentChat.messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.content && (
                  <div className={`max-w-[85%] p-4 rounded-[20px] font-medium shadow-sm ${
                    m.role === 'user' ? 'bg-slate-900 dark:bg-blue-600 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-100 dark:border-slate-700'
                  }`}>
                    {m.content}
                  </div>
                )}
                {m.draft && (
                  <div className="w-full max-w-[95%]">
                    <DraftCard 
                        data={{...m.draft, intent: m.confirmed ? '' : m.draft.intent}} 
                        confirmed={m.confirmed || false} 
                        onConfirm={() => onConfirmDraft(i)} 
                        onEdit={() => setInput(`Düzenle: ${m.draft.customerName || m.draft.productName}`)} 
                    />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border px-4 py-2 rounded-2xl flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <span className="text-xs font-bold text-slate-400">{streamingText}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input 
                ref={inputRef} 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                placeholder="Örn: 'Ahmet carisinden 500TL tahsilat yap' veya 'Yeni cari ekle: Ayşe Hanım'"
                className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-full px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white" 
            />
            <button onClick={handleSend} disabled={isTyping} className="bg-slate-900 dark:bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
