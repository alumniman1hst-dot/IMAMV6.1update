
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 * Developed by: Akhmad Arifin (Lead Developer & System Architect)
 * NIP: 19901004 202521 1012
 * Role: Fullstack & UI/UX Engineer
 * Description: Mengembangkan solusi teknologi pendidikan untuk efisiensi dan transparansi manajemen madrasah.
 * Copyright (c) 2025 MAN 1 Hulu Sungai Tengah. All rights reserved.
 */

import React, { useState, useRef, useEffect } from 'react';
import { getBambooAdvice } from '../services/geminiService';
import { ArrowRightIcon, SparklesIcon, UserIcon, ArrowLeftIcon } from './Icons';
import { ChatMessage } from '../types';

interface AdvisorProps {
  onBack: () => void;
}

const Advisor: React.FC<AdvisorProps> = ({ onBack }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Halo! Saya **Live Chat IMAM**. \n\nSaya siap memandu Anda cara mengoperasikan fitur-fitur di aplikasi ini secara langsung. Apa yang ingin Anda tanyakan?",
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialSuggestions = [
    "Bagaimana cara absen?",
    "Alur surat digital?",
    "Cara isi jurnal mengajar?",
    "Melihat kartu pelajar?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestionClick = (text: string) => {
    if (isLoading) return;
    processMessage(text);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let parts: (string | React.ReactNode)[] = [line];
      const boldRegex = /\*\*(.*?)\*\*/g;
      
      let formattedLine = line.split(boldRegex).map((part, index) => {
        if (index % 2 === 1) return <strong key={index} className="font-extrabold text-indigo-900 dark:text-white">{part}</strong>;
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={i} className="flex gap-2 ml-1 my-0.5">
            <span className="text-indigo-500">•</span>
            <span className="flex-1">{formattedLine}</span>
          </div>
        );
      }

      return <div key={i} className={line.trim() === '' ? 'h-2' : 'mb-1'}>{formattedLine}</div>;
    });
  };

  const processMessage = async (textToSend: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const responseText = await getBambooAdvice(textToSend);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const currentInput = input;
    setInput('');
    processMessage(currentInput);
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] transition-colors">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-xl p-4 pt-8 flex items-center gap-4 z-10 sticky top-0 border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors">
           <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-tight">
            Layanan Live Chat <SparklesIcon className="w-4 h-4 text-indigo-500" />
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Operator Online</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg, msgIdx) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`flex flex-col gap-2 max-w-[90%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-indigo-600' 
                    : 'bg-indigo-600 border-indigo-500 text-white'
                }`}>
                  {msg.role === 'user' ? <UserIcon className="w-4.5 h-4.5" /> : <SparklesIcon className="w-4.5 h-4.5" />}
                </div>

                {/* Bubble */}
                <div 
                  className={`p-4 rounded-[1.5rem] text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-[#151E32] text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-100 dark:border-slate-800'
                  }`}
                >
                  {renderFormattedText(msg.text)}
                  <p className={`text-[8px] mt-2 font-bold uppercase tracking-tighter opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Suggestions */}
              {msgIdx === messages.length - 1 && !isLoading && msg.role === 'model' && (
                <div className="flex flex-wrap gap-2 mt-2 pl-11">
                  {initialSuggestions.map((suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 rounded-2xl text-[10px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95 shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
             <div className="flex gap-3">
               <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <SparklesIcon className="w-4.5 h-4.5" />
               </div>
               <div className="bg-white dark:bg-[#151E32] p-4 rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-800 shadow-sm flex gap-1.5 items-center">
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300"></div>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 pb-10">
        <div className="flex gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner group focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all max-w-2xl mx-auto">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ketik pesan untuk Live Chat..."
            className="flex-1 bg-transparent px-4 text-xs font-bold outline-none text-slate-800 dark:text-white placeholder-slate-400"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 active:scale-90"
          >
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">Layanan Live Chat IMAM v6.1</p>
      </div>
    </div>
  );
};

export default Advisor;
