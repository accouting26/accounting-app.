'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { ArrowUp, ArrowDown, PlusCircle, Globe, Tag, Info, X, CheckCircle2, Clock, MessageSquare, Paperclip } from 'lucide-react';
import { Transaction, Comment } from '@/types';
import { API_BASE_URL } from '@/config';
import TransactionComments from '@/components/TransactionComments';
import { AnimatePresence, motion } from 'framer-motion';

const data = [
  { name: 'Marketing', budget: 20000, actual: 22000 },
  { name: 'Office Supplies', budget: 10000, actual: 13000 },
  { name: 'Professional Services', budget: 25000, actual: 18000 },
];

const summary = {
  revenue: 85420,
  expenses: 62580,
  profit: 22840
};

const varianceData = [
  { category: 'Marketing', budget: 20000, actual: 22000, variance: 2000, trend: 'up' },
  { category: 'Office Supplies', budget: 10000, actual: 13000, variance: -3000, trend: 'down' },
  { category: 'Professional Services', budget: 25000, actual: 18000, variance: -7000, trend: 'down' },
];

export default function Dashboard() {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/plaid/transactions`);
        const all = await res.json();
        // Show only confirmed ones here
        const confirmed = all.filter((t: any) => t.status === 'CONFIRMED' || t.status === 'Confirmed').slice(0, 5);
        
        // Add mock comments for demo
        const withComments = confirmed.map((tx: any) => ({
          ...tx,
          comments: tx.id === '1' ? [
            {
              id: 'c2',
              transaction_id: '1',
              user_id: 'cpa-1',
              user_name: 'Sarah (CPA)',
              user_role: 'cpa',
              text: 'Reimbursable flag added for the client.',
              created_at: '2026-05-03T09:15:00Z'
            }
          ] : []
        }));
        setRecentTransactions(withComments);
      } catch (error) {
        console.error(error);
        setRecentTransactions([
          { 
            id: '1', 
            vendor: 'London Taxi', 
            date: '2026-05-02', 
            amount: 45.20, 
            status: 'Confirmed', 
            original_amount: 36.00, 
            original_currency: 'GBP', 
            exchange_rate: 1.255, 
            category_id: 'travel', 
            is_reimbursable: true,
            comments: [
              {
                id: 'c2',
                transaction_id: '1',
                user_id: 'cpa-1',
                user_name: 'Sarah (CPA)',
                user_role: 'cpa',
                text: 'Reimbursable flag added for the client.',
                created_at: '2026-05-03T09:15:00Z'
              }
            ]
          },
          { id: '2', vendor: 'AWS', date: '2026-05-01', amount: 1200.00, status: 'Confirmed', category_id: 'software_subscriptions', client_tag: 'Project-Alpha', comments: [] },
        ]);
      }
    }
    fetchRecent();
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-primary">FINANCIAL DASHBOARD</h1>
        <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 self-start">
          <PlusCircle size={20} />
          <span>Connect Bank</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left column: Charts */}
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-primary mb-6">Budget vs. Actual</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="budget" fill="#2E3A59" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="actual" fill="#26A69A" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-primary">Recent Confirmed</h2>
              <button className="text-xs font-bold text-secondary hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-4">Vendor</th>
                    <th className="pb-4">Details</th>
                    <th className="pb-4 text-right">Amount (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTransactions.map((tx) => {
                    const hasAttachments = tx.has_attachments || (tx.comments && tx.comments.some(c => c.attachments && c.attachments.length > 0));
                    return (
                      <tr 
                        key={tx.id} 
                        className="text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        <td className="py-4">
                          <p className="font-bold text-primary">{tx.vendor}</p>
                          <p className="text-xs text-gray-400">{tx.date}</p>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            {tx.original_currency && tx.original_currency !== 'USD' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold" title={`Rate: ${tx.exchange_rate}`}>
                                <Globe size={10} /> {tx.original_amount?.toFixed(2)} {tx.original_currency}
                              </span>
                            )}
                            {tx.is_reimbursable && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-500 rounded text-[10px] font-bold">
                                REIMBURSABLE
                              </span>
                            )}
                            {tx.client_tag && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-500 rounded text-[10px] font-bold">
                                <Tag size={10} /> {tx.client_tag}
                              </span>
                            )}
                            {hasAttachments && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary/10 text-secondary rounded text-[10px] font-bold uppercase">
                                <Paperclip size={10} /> ATTACHMENT
                              </span>
                            )}
                            {(tx.comments && tx.comments.length > 0) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary/10 text-secondary rounded text-[10px] font-bold uppercase">
                                <MessageSquare size={10} /> {tx.comments.length}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-right font-bold text-primary">
                          ${tx.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right column: Summary */}
        <div className="space-y-6">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-10">YTD Summary</h2>
            
            <div className="mb-8">
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Total Revenue</p>
              <p className="text-4xl font-bold text-primary">${summary.revenue.toLocaleString()}</p>
            </div>
            
            <div className="mb-8">
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Total Expenses</p>
              <p className="text-4xl font-bold text-primary">${summary.expenses.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase">Net Profit</p>
              <p className="text-4xl font-bold text-primary">${summary.profit.toLocaleString()}</p>
            </div>
          </section>
        </div>
      </div>

      {/* Transaction Detail & Messaging Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedTransaction(null)} 
                className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={24} />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  <Clock size={12} />
                  <span>{selectedTransaction.date}</span>
                </div>
                <h3 className="text-2xl font-bold text-primary mb-1">{selectedTransaction.vendor}</h3>
                <p className="text-3xl font-bold text-primary">${selectedTransaction.amount.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="font-bold text-success flex items-center gap-1 text-sm uppercase">
                    <CheckCircle2 size={14} />
                    {selectedTransaction.status}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</p>
                  <p className="font-bold text-primary text-sm uppercase">
                    {selectedTransaction.category_id?.replace('_', ' ') || 'Uncategorized'}
                  </p>
                </div>
              </div>

              <TransactionComments 
                transactionId={selectedTransaction.id}
                currentUserRole="client"
                currentUserName="Alex (Client)"
                currentUserId="client-123"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
