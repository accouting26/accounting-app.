'use client';

import React, { useState } from 'react';
import { 
  Search, MessageSquare, User, Clock, Send, CheckCheck, Filter, MoreVertical
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatSession {
  id: string;
  client_name: string;
  company: string;
  last_message: string;
  time: string;
  unread: number;
  online?: boolean;
}

const sessions: ChatSession[] = [
  { id: '1', client_name: 'Alex Johnson', company: 'ACME Corp.', last_message: 'Thanks for the report, Sarah!', time: '10:24 AM', unread: 2, online: true },
  { id: '2', client_name: 'Maria Garcia', company: 'Beta Industries', last_message: 'I have a question about the London Underground transaction.', time: 'Yesterday', unread: 0, online: false },
  { id: '3', client_name: 'David Chen', company: 'Gamma LLC', last_message: 'Is the draft finalized?', time: 'Tue', unread: 0, online: true },
];

export default function CpaMessagesPage() {
  const [selectedSession, setSelectedSession] = useState<ChatSession>(sessions[0]);
  const [message, setMessage] = useState('');

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-3xl shadow-sm border border-[#E0E0E0] overflow-hidden">
      {/* Session List */}
      <div className="w-[380px] border-r border-[#F1F3F5] flex flex-col">
        <div className="p-6 border-b border-[#F1F3F5]">
          <h2 className="text-xl font-bold text-[#2E3A59] mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search clients or messages..." 
              className="w-full bg-[#F8F9FA] border-none rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#26A69A]/20 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className={cn(
                "w-full p-6 text-left flex items-start gap-4 transition-all hover:bg-gray-50 border-b border-[#F8F9FA]",
                selectedSession.id === session.id && "bg-[#EBF5FB] border-l-4 border-l-[#26A69A]"
              )}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-[#2E3A59] rounded-full flex items-center justify-center text-white font-bold">
                  {session.client_name.charAt(0)}
                </div>
                {session.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#66BB6A] border-2 border-white rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-bold text-[#2E3A59] truncate">{session.client_name}</h4>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{session.time}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1 font-medium">{session.company}</p>
                <p className={cn(
                  "text-xs truncate",
                  session.unread > 0 ? "text-[#2E3A59] font-bold" : "text-gray-400"
                )}>
                  {session.last_message}
                </p>
              </div>
              {session.unread > 0 && (
                <div className="bg-[#26A69A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {session.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#F8F9FA]/50">
        {/* Chat Header */}
        <div className="px-8 py-4 bg-white border-b border-[#F1F3F5] flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#2E3A59] rounded-full flex items-center justify-center text-white font-bold text-sm">
              {selectedSession.client_name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-[#2E3A59]">{selectedSession.client_name}</h3>
              <p className="text-[10px] text-[#66BB6A] font-bold uppercase tracking-wider">
                {selectedSession.online ? 'Online' : 'Last seen 2h ago'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all">
              <Filter size={18} />
            </button>
            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">
          <div className="self-center bg-gray-200/50 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
            Today
          </div>
          
          <div className="self-start max-w-[70%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-[#E0E0E0]">
            <p className="text-sm text-[#2E3A59] leading-relaxed">
              Hi Sarah, I noticed a few transactions from Amazon that weren't categorized. Should I mark them as office supplies?
            </p>
            <span className="text-[10px] text-gray-400 mt-2 block">10:20 AM</span>
          </div>

          <div className="self-end max-w-[70%] bg-[#26A69A] p-4 rounded-2xl rounded-tr-none shadow-md shadow-[#26A69A]/20 text-white">
            <p className="text-sm leading-relaxed">
              Yes, please! Most of those are for the new office chairs we ordered. I've also flagged a few other items for your review.
            </p>
            <div className="flex justify-end items-center gap-1 mt-2">
              <span className="text-[10px] text-white/70">10:22 AM</span>
              <CheckCheck size={12} className="text-white/70" />
            </div>
          </div>

          <div className="self-start max-w-[70%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-[#E0E0E0]">
            <p className="text-sm text-[#2E3A59] leading-relaxed">
              {selectedSession.last_message}
            </p>
            <span className="text-[10px] text-gray-400 mt-2 block">{selectedSession.time}</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-[#F1F3F5]">
          <form 
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-4"
          >
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..." 
              className="flex-1 bg-[#F8F9FA] border-none rounded-xl px-6 py-4 text-sm outline-none focus:ring-2 focus:ring-[#26A69A]/20 transition-all"
            />
            <button className="bg-[#26A69A] text-white p-4 rounded-xl hover:bg-[#1E867D] transition-all shadow-lg shadow-[#26A69A]/20">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
