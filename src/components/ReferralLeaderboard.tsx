'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, UserCheck, UserPlus, Copy, Check, Loader2, Sparkles, Star, Award, ArrowRight, CreditCard
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE_URL } from '@/config';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ReferralLeader {
  email: string;
  company: string;
  signed_up: number;
  active: number;
  paid: number;
  is_current?: boolean;
}

export default function ReferralLeaderboard() {
  const [leaders, setLeaders] = useState<ReferralLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [myCode] = useState('PREC6789'); // Mock current user code for demo
  const leaderboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/cpa/leaderboard`);
        if (!res.ok) throw new Error('Failed to fetch leaderboard');
        const data = await res.json();
        
        // Map API data to our component interface
        const mappedData: ReferralLeader[] = data.map((item: any) => ({
          email: item.referrer_email,
          company: item.company_name || 'Independent Partner',
          signed_up: item.referral_count,
          active: item.active_referral_count,
          paid: item.paid_referral_count,
          // For demo, let's assume sarah@example.com is the current user if we see it
          is_current: item.referrer_email === 'sarah@example.com'
        }));
        
        setLeaders(mappedData);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        // Fallback to previous mock winners if API fails or is empty for demo
        setLeaders([
          { email: 'expert@example.com', company: 'Expert Accounting Firm', signed_up: 15, active: 8, paid: 5 },
          { email: 'sarah@example.com', company: 'Precision Tax Partners', signed_up: 10, active: 3, paid: 2, is_current: true },
          { email: 'precision@example.com', company: 'Precision Bookkeeping', signed_up: 8, active: 2, paid: 1 },
          { email: 'elena@example.com', company: 'Apex Financial Services', signed_up: 5, active: 1, paid: 0 },
          { email: 'david@example.com', company: 'Blue Chip Accounting', signed_up: 3, active: 1, paid: 0 },
        ]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToLeaderboard = () => {
    leaderboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#E0E0E0] p-12 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[#26A69A] mb-4" size={32} />
        <p className="text-gray-400 font-medium">Fetching real-time standings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Final Results Banner */}
      <div className="bg-[#F0F9FF] border border-[#0EA5E9] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#0EA5E9]/10 rounded-full text-[#0EA5E9]">
            <Trophy size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#0369A1]">AI Pioneer Referral Contest: Final Results are IN! 🏆</h3>
            <p className="text-sm text-[#0EA5E9]">Congratulations to our winners and thank you to everyone who participated.</p>
          </div>
        </div>
        <button 
          onClick={scrollToLeaderboard}
          className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap"
        >
          See Winners <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" ref={leaderboardRef}>
        {/* Referral Code Section */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-[#2E3A59] rounded-2xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/20">
            <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12">
              <Sparkles size={120} />
            </div>
            
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Star className="text-yellow-400 fill-yellow-400" size={20} />
              Partner Incentive
            </h3>
            <p className="text-indigo-100 text-sm mb-8 leading-relaxed">
              Refer 3 active clients to receive 1 year of 'Business Tier' access for free.
            </p>

            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest">My Referral Code</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-mono font-bold text-lg tracking-widest flex items-center justify-center">
                  {myCode}
                </div>
                <button 
                  onClick={handleCopy}
                  className="bg-[#26A69A] hover:bg-[#1E867D] text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-[#26A69A]/30"
                  title="Copy Code"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-[10px] text-indigo-300 text-center italic">
                {copied ? 'Code copied to clipboard!' : 'Click the button to copy your code'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E0E0E0] shadow-sm">
            <h4 className="text-sm font-bold text-[#2E3A59] mb-4 uppercase tracking-wider">Your Final Progress</h4>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-400 uppercase">Referral Goal (3 Active)</span>
                  <span className="text-[#26A69A]">100%</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-[#26A69A] h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8F9FA] p-4 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Signed Up</p>
                  <p className="text-xl font-bold text-[#2E3A59]">10</p>
                </div>
                <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#26A69A]/20">
                  <p className="text-[10px] font-bold text-[#26A69A] uppercase mb-1">Active</p>
                  <p className="text-xl font-bold text-[#2E3A59]">3</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#E0E0E0] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#F1F3F5] flex justify-between items-center bg-[#F8F9FA]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="text-yellow-600" size={20} />
              </div>
              <h2 className="text-xl font-bold text-[#2E3A59]">Final Standings (Contest Ended Day 12)</h2>
            </div>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Closed
            </span>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-[#E0E0E0]">
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Partner</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Active</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F5]">
                {leaders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center text-gray-400 italic">
                      No referral data found.
                    </td>
                  </tr>
                ) : (
                  leaders.map((leader, index) => (
                    <tr 
                      key={leader.email} 
                      className={cn(
                        "transition-colors",
                        leader.is_current ? "bg-[#EBF5FB]/50" : "hover:bg-gray-50"
                      )}
                    >
                      <td className="px-8 py-5">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-slate-100 text-slate-700" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "text-gray-400"
                        )}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <p className="font-bold text-[#2E3A59]">
                              {leader.company}
                              {leader.is_current && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-tight">You</span>}
                            </p>
                            <p className="text-xs text-gray-400">{leader.email}</p>
                          </div>
                          {index < 3 && (
                            <span className="flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-bold uppercase border border-yellow-200 shadow-sm">
                              <Trophy size={10} /> Winner
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={cn(
                            "px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 border",
                            index < 3 ? "bg-green-100 text-[#26A69A] border-[#26A69A]/20" : "bg-gray-50 text-gray-400 border-gray-200"
                          )}>
                            <UserCheck size={12} />
                            {leader.active}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={cn(
                            "px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 border",
                            leader.paid > 0 ? "bg-indigo-100 text-indigo-600 border-indigo-200" : "bg-gray-50 text-gray-400 border-gray-200"
                          )}>
                            <CreditCard size={12} />
                            {leader.paid}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-gray-50 border-t border-[#E0E0E0]">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Thank you to all our AI Pioneers! The contest is now closed. <br />
              Your referral links will continue to track signups for future reward tiers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
