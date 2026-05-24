'use client';

import React, { useState } from 'react';
import { 
  Search, MessageSquare, User, Clock, Send, CheckCheck, MoreVertical, ShieldCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ClientMessagesPage() {
  const [message, setMessage] = useState('');

  return (
    <div className="max-w-4xl mx-auto px-6 pt-10 pb-24 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">CPA Concierge</h1>
          <p className="text-sm text-gray-500">Direct support from your dedicated accounting team</p>
        </div>
        <div className="hidden md:flex bg-secondary/10 px-4 py-2 rounded-xl items-center gap-2 border border-secondary/20">
          <ShieldCheck className="text-secondary" size={20} />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Expert Verified</span>
        </div>
      </header>

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-[#E0E0E0] overflow-hidden flex flex-col h-[calc(100vh-280px)]">
        {/* Chat Header */}
        <div className="px-8 py-5 bg-white border-b border-[#F1F3F5] flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                S
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#66BB6A] border-2 border-white rounded-full" />
            </div>
            <div>
              <h3 className="font-bold text-primary">Sarah Miller, CPA</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Precision Tax Partners • Online
              </p>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6 bg-[#F8F9FA]/30">
          <div className="self-center bg-gray-200/50 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Monday, May 11
          </div>
          
          <div className="self-start max-w-[80%] md:max-w-[70%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-[#E0E0E0]">
            <p className="text-sm text-primary leading-relaxed font-medium">
              Hi Alex! I've finished reviewing your transactions for April. I have a quick question about the "Adobe Systems" charge on the 21st.
            </p>
            <span className="text-[10px] text-gray-400 mt-2 block font-bold">10:20 AM</span>
          </div>

          <div className="self-start max-w-[80%] md:max-w-[70%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-[#E0E0E0]">
            <p className="text-sm text-primary leading-relaxed font-medium">
              Is that the standard Creative Cloud subscription, or a one-time purchase?
            </p>
            <span className="text-[10px] text-gray-400 mt-2 block font-bold">10:21 AM</span>
          </div>

          <div className="self-end max-w-[80%] md:max-w-[70%] bg-secondary p-4 rounded-2xl rounded-tr-none shadow-md shadow-secondary/20 text-white">
            <p className="text-sm leading-relaxed font-medium">
              It's the monthly subscription. I've updated the tag in the inbox now. Thanks for catching that!
            </p>
            <div className="flex justify-end items-center gap-1 mt-2">
              <span className="text-[10px] text-white/70 font-bold">10:24 AM</span>
              <CheckCheck size={12} className="text-white/70" />
            </div>
          </div>

          <div className="self-start max-w-[80%] md:max-w-[70%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-[#E0E0E0]">
            <p className="text-sm text-primary leading-relaxed font-medium">
              Perfect, thank you! I'll finalize the April report and have it ready for you by Wednesday.
            </p>
            <span className="text-[10px] text-gray-400 mt-2 block font-bold">10:25 AM</span>
          </div>

          <div className="self-center bg-gray-200/50 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mt-4">
            Today
          </div>

          <div className="self-start max-w-[80%] md:max-w-[70%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-[#E0E0E0]">
            <p className="text-sm text-primary leading-relaxed font-medium">
              Hi Alex, just a reminder that the draft tax package is ready for your signature in the Reports section.
            </p>
            <span className="text-[10px] text-gray-400 mt-2 block font-bold">09:15 AM</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-[#F1F3F5] z-10">
          <form 
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-4"
          >
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message Sarah..." 
              className="flex-1 bg-[#F8F9FA] border-2 border-transparent rounded-xl px-6 py-4 text-sm outline-none focus:border-secondary/20 focus:bg-white transition-all font-medium"
            />
            <button className="bg-secondary text-white p-4 rounded-xl hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 active:scale-95">
              <Send size={24} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
