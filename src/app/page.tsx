'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SwipeableCardComponent from '@/components/SwipeableCard';
import TransactionComments from '@/components/TransactionComments';
import { MoreHorizontal, Loader2, X, Check, Save } from 'lucide-react';
import { Transaction, Comment } from '@/types';
import { API_BASE_URL } from '@/config';

export default function TransactionInbox() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/plaid/transactions`);
        const data = await res.json();
        
        // Filter for Unprocessed transactions for the inbox
        const unprocessed = data.filter((t: any) => t.status === 'UNPROCESSED' || t.status === 'Unprocessed');
        
        // If no unprocessed, use some mock data with multi-currency and tags for demonstration
        if (unprocessed.length === 0) {
          setTransactions([
            { 
              id: 'm1', 
              vendor: 'Adobe Systems', 
              date: '2026-04-21', 
              amount: 52.99, 
              status: 'Unprocessed', 
              category_suggestion: 'Software',
              is_reimbursable: true,
              client_tag: 'Project-X',
              has_attachments: true,
              comments: [
                {
                  id: 'c1',
                  transaction_id: 'm1',
                  user_id: 'cpa-1',
                  user_name: 'Sarah (CPA)',
                  user_role: 'cpa',
                  text: 'Is this for the creative cloud subscription?',
                  attachments: [
                    { id: 'a1', name: 'adobe_receipt.pdf', url: '#', type: 'application/pdf' }
                  ],
                  created_at: '2026-04-22T10:00:00Z'
                }
              ]
            },
            { 
              id: 'm2', 
              vendor: 'London Underground', 
              date: '2026-04-19', 
              amount: 12.50, 
              status: 'Unprocessed', 
              category_suggestion: 'Travel',
              original_amount: 10.00,
              original_currency: 'GBP',
              exchange_rate: 1.25,
              comments: []
            },
            { 
              id: 'm3', 
              vendor: 'Amazon.de', 
              date: '2026-04-17', 
              amount: 45.60, 
              status: 'Unprocessed', 
              category_suggestion: 'Office Supplies',
              original_amount: 42.00,
              original_currency: 'EUR',
              exchange_rate: 1.0857,
              comments: []
            },
          ]);
        } else {
          setTransactions(unprocessed.map((t: any) => ({
            id: t.id,
            vendor: t.vendor,
            date: t.date,
            amount: parseFloat(t.amount),
            status: t.status,
            category_suggestion: t.category_id,
            original_amount: t.original_amount,
            original_currency: t.original_currency,
            exchange_rate: t.exchange_rate,
            is_reimbursable: t.is_reimbursable,
            client_tag: t.client_tag,
            comments: []
          })));
        }
      } catch (error) {
        console.error("Failed to fetch transactions", error);
        // Fallback
        setTransactions([
          { id: 'm1', vendor: 'Adobe Systems', date: '2026-04-21', amount: 52.99, status: 'Unprocessed', category_suggestion: 'Software', is_reimbursable: true, client_tag: 'Project-X', comments: [] },
          { id: 'm2', vendor: 'London Underground', date: '2026-04-19', amount: 12.50, status: 'Unprocessed', category_suggestion: 'Travel', original_amount: 10.00, original_currency: 'GBP', exchange_rate: 1.25, comments: [] },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const handleSwipe = async (id: string, type: 'business' | 'personal') => {
    console.log(`Swiped ${id} as ${type}`);
    
    // Optimistic update
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    if (!id.startsWith('m')) {
      try {
        await fetch(`${API_BASE_URL}/api/ai/feedback?transaction_id=${id}&category_id=${type === 'business' ? 'confirmed' : 'personal'}`, {
          method: 'POST'
        });
      } catch (error) {
        console.error("Failed to send feedback", error);
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    setSaving(true);
    
    try {
      if (!editingTransaction.id.startsWith('m')) {
        const res = await fetch(`${API_BASE_URL}/api/transactions/${editingTransaction.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            is_reimbursable: editingTransaction.is_reimbursable,
            client_tag: editingTransaction.client_tag
          })
        });
        if (!res.ok) throw new Error('Failed to save');
      }
      
      // Update local state
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id ? editingTransaction : t
      ));
      setEditingTransaction(null);
    } catch (error) {
      console.error(error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 pt-10 pb-24 min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-primary">Accounting</h1>
          <p className="text-sm text-gray-500">at your Service</p>
        </div>
        <button className="text-gray-400">
          <MoreHorizontal size={24} />
        </button>
      </header>

      <h2 className="text-2xl font-bold text-primary mb-6">Transaction Inbox</h2>

      <div className="flex-1 relative">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-secondary" size={32} />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {transactions.length > 0 ? (
              <div className="relative h-64">
                {transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    className="absolute inset-0"
                    style={{ zIndex: transactions.length - index }}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1 - index * 0.05, y: -index * 10 }}
                    exit={{ opacity: 0, x: 500 }}
                    transition={{ duration: 0.3 }}
                  >
                    {index === 0 && (
                      <SwipeableCardComponent
                        transaction={transaction}
                        onSwipeRight={() => handleSwipe(transaction.id, 'business')}
                        onSwipeLeft={() => handleSwipe(transaction.id, 'personal')}
                        onClick={() => setEditingTransaction(transaction)}
                      />
                    )}
                    {index > 0 && index < 3 && (
                      <div className="w-full h-48 bg-white/50 rounded-2xl border border-gray-100 shadow-sm" />
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-64 text-center"
              >
                <div className="w-48 h-48 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl text-gray-300">✓</span>
                </div>
                <h3 className="text-lg font-bold text-primary">All caught up!</h3>
                <p className="text-sm text-gray-500">Your inbox is empty.</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary">Edit Details</h3>
                <button onClick={() => setEditingTransaction(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reimbursable</label>
                  <button 
                    onClick={() => setEditingTransaction({
                      ...editingTransaction, 
                      is_reimbursable: !editingTransaction.is_reimbursable
                    })}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                      editingTransaction.is_reimbursable 
                        ? "border-secondary bg-secondary/5 text-secondary" 
                        : "border-gray-100 text-gray-400"
                    )}
                  >
                    <span className="font-bold">Flag as Reimbursable</span>
                    {editingTransaction.is_reimbursable ? <Check size={20} /> : <div className="w-5 h-5" />}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Client Tag</label>
                  <input 
                    type="text" 
                    value={editingTransaction.client_tag || ''}
                    onChange={(e) => setEditingTransaction({
                      ...editingTransaction,
                      client_tag: e.target.value
                    })}
                    placeholder="e.g. Project-Alpha, Personal-Vacation"
                    className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-secondary outline-none transition-all font-medium text-primary"
                  />
                </div>

                <TransactionComments 
                  transactionId={editingTransaction.id}
                  currentUserRole="client"
                  currentUserName="Alex (Client)"
                  currentUserId="client-123"
                />

                <button 
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-16 flex justify-between text-xs font-medium text-gray-400 uppercase tracking-wider">
        <div className="flex flex-col items-start gap-1">
          <span>Swipe Right</span>
          <span className="text-success font-bold">Business</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span>Swipe Left</span>
          <span className="text-error font-bold">Personal</span>
        </div>
      </div>
    </div>
  );
}

// Utility function copied for simplicity or could be imported
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
