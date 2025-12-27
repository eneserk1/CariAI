
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentChat = state.chatSessions.find(s => s.id === state.currentChatId) || state.chatSessions[0];

  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
    }
    if (!isPopup) {
      // On mobile, autofocus might cause keyboard jump, so strictly optional based on UX pref.
      // Keeping it for now but user can tap to focus.
       if(window.innerWidth > 768) inputRef.current?.focus();
    } else {
       setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [initialValue, isPopup]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentChat.messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userInput = input;
    setInput('');
    setIsTyping(true);
    
    onAddUserMessage(userInput);

    try {
      const response = await geminiService.processMessage(userInput, state, currentChat.messages);
      const isDraft = response.intent === 'SALE_RECORD' || response.intent === 'PURCHASE_RECORD';
      
      onUpdateState(
        '', 
        response.intent || 'GENERAL_CHAT', 
        response.data || {}, 
        response.message || response.text || "Anladım.",
        isDraft
      );
    } catch (error) {
      console.error(error);
      onUpdateState('', 'GENERAL_CHAT', {}, "Bağlantıda bir kopukluk oldu, tekrar dener misin?", false);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={`flex h-full w-full bg-[#FBFBFD] md:bg-white overflow-hidden ${isPopup ? 'rounded-[32px]' : 'md:animate-in md:fade-in md:slide-in-from-right-4 duration-500'} ${!isPopup ? '-mx-4 w-[calc(100%+2rem)] md:mx-0 md:w-full' : ''}`}>
      
      {/* Sidebar - Desktop Only */}
      {!isPopup && (
        <div className="w-72 bg-slate-50/50 border-r border-slate-100 flex flex-col p-6 hidden lg:flex">
          <button 
            onClick={onNewChat}
            className="w-full bg-white border border-slate-200 text-slate-900 font-bold py-3 rounded-2xl hover:shadow-lg transition-all mb-8 text-[13px] uppercase tracking-wider"
          >
            + Yeni Görüşme
          </button>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {state.chatSessions.sort((a,b) => b.lastUpdate - a.lastUpdate).map(s => (
              <button
                key={s.id}
                onClick={() => onSelectChat(s.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all ${
                  state.currentChatId === s.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white hover:shadow-md'
                }`}
              >
                <p className="font-bold text-[13px] truncate leading-tight">{s.messages[s.messages.length-1]?.content.substring(0, 30) || 'Yeni Sohbet'}</p>
                <p className={`text-[10px] mt-1 font-bold ${state.currentChatId === s.id ? 'text-slate-400' : 'text-slate-300'}`}>
                  {new Date(s.lastUpdate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header (Non-Popup) */}
        {!isPopup && (
            <div className="md:hidden px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-900/20">AI</div>
                    <div>
                        <p className="font-bold text-lg text-slate-900 leading-none">Asistan</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-0.5">Çevrimiçi</p>
                    </div>
                </div>
                <button onClick={onNewChat} className="w-9 h-9 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
            </div>
        )}

        {/* Popup Header */}
        {isPopup && (
            <div className="p-4 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="font-bold text-xs text-slate-900">DefterAI Asistan</span>
                </div>
            </div>
        )}

        {/* Messages Area */}
        <div ref={scrollRef} className={`flex-1 overflow-y-auto custom-scrollbar ${isPopup ? 'p-4' : 'p-4 md:p-12'}`}>
          <div className={`${isPopup ? 'max-w-full' : 'max-w-3xl'} mx-auto space-y-4 md:space-y-6 pb-4`}>
            {currentChat.messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                {m.content && (
                  <div className={`max-w-[85%] md:max-w-[75%] ${isPopup ? 'p-3 text-sm' : 'px-5 py-3 md:p-6 text-[15px] md:text-[16px]'} rounded-[20px] font-medium leading-relaxed shadow-sm ${
                    m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-sm' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-100'
                  }`}>
                    {m.content}
                  </div>
                )}
                {m.draft && (
                  <div className="w-full max-w-[95%] md:max-w-md">
                    <DraftCard 
                        data={{...m.draft, intent: m.confirmed ? '' : 'SALE_RECORD'}} 
                        confirmed={m.confirmed || false} 
                        onConfirm={() => onConfirmDraft(i)} 
                        onEdit={() => setInput(`Düzenle: ${m.draft.customerName} ${m.draft.productName}`)} 
                    />
                  </div>
                )}
                <span className="text-[9px] text-slate-300 font-bold mt-1 px-1">
                    {new Date(m.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                </span>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-[20px] rounded-tl-sm flex space-x-1.5 items-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Input Area */}
        <div className={`${isPopup ? 'p-3' : 'p-3 md:p-12'} shrink-0 bg-white md:bg-gradient-to-t md:from-[#FBFBFD] md:via-[#FBFBFD] md:to-transparent border-t md:border-t-0 border-slate-100`}>
          <div className={`${isPopup ? 'max-w-full' : 'max-w-3xl'} mx-auto relative flex items-center gap-2 md:gap-0`}>
            {/* Mobile / Popup Style Input */}
            <input 
                ref={inputRef} 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                placeholder={isPopup ? "Bir şeyler yaz..." : "DefterAI'ya yazın..."}
                className={`flex-1 bg-slate-100 md:bg-white border-0 md:border md:border-slate-200 md:shadow-xl md:shadow-blue-900/5 rounded-full pl-5 pr-4 md:pr-32 py-3 md:py-5 text-[15px] md:text-lg transition-all focus:outline-none focus:ring-2 md:focus:ring-0 focus:ring-blue-100 md:focus:border-[#1A237E] placeholder:text-slate-400 font-medium`} 
            />
            
            {/* Mobile Send Button (Icon) */}
            <button 
                onClick={handleSend} 
                disabled={isTyping || !input.trim()} 
                className="md:hidden w-11 h-11 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
            >
                <svg className="w-5 h-5 translate-x-0.5 -translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            </button>

            {/* Desktop Send Button (Text) */}
            <button 
                onClick={handleSend} 
                disabled={isTyping} 
                className={`hidden md:block absolute top-1/2 -translate-y-1/2 bg-slate-900 text-white rounded-full font-bold uppercase hover:bg-blue-900 disabled:opacity-50 transition-all shadow-lg active:scale-95 ${isPopup ? 'right-1.5 p-2 text-[10px]' : 'right-3 px-8 py-3 text-sm'}`}
            >
                {isPopup ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                ) : 'Gönder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
