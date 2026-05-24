'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, AlertCircle, Download, FileSearch, Loader2, ChevronRight, TrendingUp, TrendingDown, Globe, Clock, Paperclip
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Transaction, Comment } from '@/types';
import { API_BASE_URL } from '@/config';
import TransactionComments from '@/components/TransactionComments';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Save, MessageSquare } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Client {
  id: string;
  email: string;
  company_name: string;
  total_confirmed_transactions: number;
  total_unprocessed_transactions: number;
}

interface ClientDashboard {
  revenue: number;
  expenses: number;
  net_profit: number;
}

export default function CpaClientDetailView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dashboardData, setDashboardData] = useState<ClientDashboard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [view, setView] = useState<'summary' | 'transactions'>('summary');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'unprocessed' | 'up-to-date'>('all');

  // Multi-select state
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [showBulkExportModal, setShowBulkExportModal] = useState(false);
  const [exportFormats, setFormats] = useState({
    drake_schedule_c: true,
    drake_trial_balance: true,
    pdf_report: true,
    qbo: false
  });
  const [isExporting, setIsExporting] = useState(false);

  const toggleClientSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClientIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredClients = clients.filter(client => {
    if (statusFilter === 'unprocessed') return client.total_unprocessed_transactions > 0;
    if (statusFilter === 'up-to-date') return client.total_unprocessed_transactions === 0;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedClientIds.length === filteredClients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filteredClients.map(c => c.id));
    }
  };

  const handleBulkExport = async () => {
    setIsExporting(true);
    try {
      const formatParams = Object.entries(exportFormats)
        .filter(([_, value]) => value)
        .map(([key, _]) => `formats=${key}`)
        .join('&');
      
      const clientParams = selectedClientIds
        .map(id => `client_ids=${id}`)
        .join('&');

      const url = `${API_BASE_URL}/api/cpa/bulk-download?cpa_id=cpa-123&${clientParams}&${formatParams}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `cpa_bulk_export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setShowBulkExportModal(false);
      } else {
        const errorData = await res.json();
        alert(`Failed to generate export: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error generating export');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/cpa/clients?cpa_id=cpa-123`);
        if (!res.ok) throw new Error('Failed to fetch clients');
        const data = await res.json();
        setClients(data);
        if (data.length > 0) {
          setSelectedClient(data[0]);
        }
      } catch (error) {
        console.error(error);
        setClients([
          { id: '1', email: 'acme@example.com', company_name: 'ACME Corp.', total_confirmed_transactions: 145, total_unprocessed_transactions: 0 },
          { id: '2', email: 'beta@example.com', company_name: 'Beta Industries', total_confirmed_transactions: 89, total_unprocessed_transactions: 12 },
        ]);
        setSelectedClient({ id: '1', email: 'acme@example.com', company_name: 'ACME Corp.', total_confirmed_transactions: 145, total_unprocessed_transactions: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      async function fetchClientDetails() {
        setFetchingDetails(true);
        try {
          // Fetch Dashboard
          const dashRes = await fetch(`${API_BASE_URL}/api/cpa/clients/${selectedClient?.id}/dashboard?cpa_id=cpa-123`);
          const dashData = await dashRes.json();
          setDashboardData(dashData);

          // Fetch Transactions
          const txRes = await fetch(`${API_BASE_URL}/api/cpa/clients/${selectedClient?.id}/transactions?cpa_id=cpa-123`);
          const txData = await txRes.json();
          // Add some mock comments to the fetched transactions for demo
          const txWithComments = txData.map((tx: any) => ({
            ...tx,
            comments: tx.id === 't1' ? [
              {
                id: 'c1',
                transaction_id: 't1',
                user_id: 'client-1',
                user_name: 'Alex (Client)',
                user_role: 'client',
                text: 'Wait, I thought this was 150?',
                created_at: '2026-05-02T14:30:00Z'
              }
            ] : []
          }));
          setTransactions(txWithComments);
        } catch (error) {
          console.error(error);
          setDashboardData({ revenue: 7500, expenses: 4750, net_profit: 2750 });
          setTransactions([
            { 
              id: 't1', 
              vendor: 'Amazon.co.uk', 
              date: '2026-05-01', 
              amount: 125.50, 
              status: 'Confirmed', 
              original_amount: 100.00, 
              original_currency: 'GBP', 
              exchange_rate: 1.255, 
              category_id: 'office_expense',
              comments: [
                {
                  id: 'c1',
                  transaction_id: 't1',
                  user_id: 'client-1',
                  user_name: 'Alex (Client)',
                  user_role: 'client',
                  text: 'Wait, I thought this was 150?',
                  created_at: '2026-05-02T14:30:00Z'
                }
              ]
            },
            { 
              id: 't2', 
              vendor: 'Google Cloud', 
              date: '2026-04-28', 
              amount: 49.99, 
              status: 'Confirmed', 
              category_id: 'software_subscriptions',
              comments: []
            },
          ]);
        } finally {
          setFetchingDetails(false);
        }
      }
      fetchClientDetails();
    }
  }, [selectedClient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="animate-spin text-[#26A69A]" size={48} />
      </div>
    );
  }

  return (
    <div className="flex gap-8 h-[calc(100vh-160px)]">
      {/* Left Column: Client List */}
      <div className="w-[350px] bg-white rounded-2xl shadow-sm border border-[#E0E0E0] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-[#F1F3F5]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#2E3A59]">Clients</h2>
            <button 
              onClick={() => setShowBulkExportModal(true)}
              disabled={selectedClientIds.length === 0}
              className="text-xs font-bold text-[#26A69A] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bulk Export ({selectedClientIds.length})
            </button>
          </div>
          
          <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-lg">
            <button 
              onClick={() => setStatusFilter('all')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                statusFilter === 'all' ? "bg-white shadow-sm text-[#26A69A]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              All
            </button>
            <button 
              onClick={() => setStatusFilter('unprocessed')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                statusFilter === 'unprocessed' ? "bg-white shadow-sm text-[#FF7043]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Action
            </button>
            <button 
              onClick={() => setStatusFilter('up-to-date')}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
                statusFilter === 'up-to-date' ? "bg-white shadow-sm text-[#66BB6A]" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Done
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={selectedClientIds.length === filteredClients.length && filteredClients.length > 0}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-[#26A69A] focus:ring-[#26A69A]"
            />
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Select {statusFilter !== 'all' ? statusFilter : 'All'}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-[#F1F3F5]">
          {filteredClients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={cn(
                "w-full p-6 text-left flex items-center gap-4 transition-all group",
                selectedClient?.id === client.id ? "bg-[#EBF5FB]" : "hover:bg-gray-50"
              )}
            >
              <div 
                onClick={(e) => toggleClientSelection(client.id, e)}
                className="flex-shrink-0"
              >
                <input 
                  type="checkbox" 
                  checked={selectedClientIds.includes(client.id)}
                  readOnly
                  className="rounded border-gray-300 text-[#26A69A] focus:ring-[#26A69A] cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#2E3A59] group-hover:text-[#26A69A] transition-colors truncate">{client.company_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {client.total_unprocessed_transactions > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-[#FF7043]">
                      <AlertCircle size={12} />
                      {client.total_unprocessed_transactions}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-[#66BB6A]">
                      <CheckCircle2 size={12} />
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className={cn("text-gray-300 transition-transform flex-shrink-0", selectedClient?.id === client.id && "translate-x-1 text-[#26A69A]")} />
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Client Details */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-4">
        {selectedClient && (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-[#2E3A59]">{selectedClient.company_name}</h1>
                <p className="text-gray-500 mt-1">Managing financials for <span className="font-medium text-[#2E3A59]">{selectedClient.email}</span></p>
              </div>
              <div className="flex gap-4">
                <button className="bg-[#2E3A59] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#1E2A44] transition-all shadow-lg shadow-[#2E3A59]/20 text-sm">
                  <Download size={18} />
                  <span>Download Export</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-200">
              <button 
                onClick={() => setView('summary')}
                className={cn(
                  "pb-4 text-sm font-bold transition-all border-b-2",
                  view === 'summary' ? "text-[#26A69A] border-[#26A69A]" : "text-gray-400 border-transparent hover:text-gray-600"
                )}
              >
                Financial Summary
              </button>
              <button 
                onClick={() => setView('transactions')}
                className={cn(
                  "pb-4 text-sm font-bold transition-all border-b-2",
                  view === 'transactions' ? "text-[#26A69A] border-[#26A69A]" : "text-gray-400 border-transparent hover:text-gray-600"
                )}
              >
                Recent Transactions
              </button>
            </div>

            {fetchingDetails ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-200" size={32} />
              </div>
            ) : view === 'summary' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#66BB6A]" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Income</p>
                    <div className="flex items-baseline gap-2">
                      <h4 className="text-2xl font-bold text-[#2E3A59]">${dashboardData?.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                      <TrendingUp size={14} className="text-[#66BB6A]" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#FF7043]" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Expenses</p>
                    <div className="flex items-baseline gap-2">
                      <h4 className="text-2xl font-bold text-[#2E3A59]">${dashboardData?.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                      <TrendingDown size={14} className="text-[#FF7043]" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#26A69A]" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Net Profit</p>
                    <h4 className="text-2xl font-bold text-[#2E3A59]">${dashboardData?.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h4>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#E0E0E0] overflow-hidden">
                  <div className="p-6 bg-[#F1F3F5] border-b border-[#E0E0E0] flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[#2E3A59]">Categorized Summary</h2>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-200 px-3 py-1 rounded-full">YTD 2026</span>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-[#E0E0E0]">
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F3F5]">
                      <tr className="hover:bg-[#EBF5FB] transition-colors">
                        <td className="px-8 py-4 font-medium text-[#2E3A59]">Revenue</td>
                        <td className="px-8 py-4 text-right font-bold text-[#2E3A59]">${dashboardData?.revenue.toLocaleString()}</td>
                        <td className="px-8 py-4 text-center"><CheckCircle2 size={18} className="text-[#66BB6A] mx-auto" /></td>
                      </tr>
                      {/* More rows would go here in a real app */}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E0E0E0] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-[#E0E0E0] bg-gray-50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount (USD)</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Chat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F3F5]">
                    {transactions.map((tx) => {
                      const isMulti = tx.original_currency && tx.original_currency !== 'USD';
                      const hasComments = tx.comments && tx.comments.length > 0;
                      const hasAttachments = tx.has_attachments || (tx.comments && tx.comments.some(c => c.attachments && c.attachments.length > 0));
                      return (
                        <tr 
                          key={tx.id} 
                          className="hover:bg-gray-50 transition-colors cursor-pointer group"
                          onClick={() => setSelectedTransaction(tx)}
                        >
                          <td className="px-6 py-4 text-sm text-gray-500">{tx.date}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-[#2E3A59] group-hover:text-[#26A69A] transition-colors">{tx.vendor}</p>
                            {isMulti && (
                              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <Globe size={10} />
                                {tx.original_amount?.toFixed(2)} {tx.original_currency} @ {tx.exchange_rate?.toFixed(4)}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase">
                              {tx.category_id?.replace('_', ' ') || 'Uncategorized'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="font-bold text-[#2E3A59]">${tx.amount.toFixed(2)}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className={cn(
                              "inline-flex items-center justify-center w-8 h-8 rounded-full transition-all relative",
                              (hasComments || hasAttachments) ? "bg-secondary/10 text-secondary" : "text-gray-200 group-hover:text-gray-400"
                            )}>
                              {hasAttachments ? <Paperclip size={16} /> : <MessageSquare size={16} />}
                              {hasComments && (
                                <span className={cn(
                                  "absolute rounded-full border border-white bg-secondary",
                                  hasAttachments ? "-top-1 -right-1 w-2 h-2" : "ml-5 mb-5 w-2 h-2"
                                )} />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
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
                  <p className="font-bold text-success flex items-center gap-1 text-sm">
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
                currentUserRole="cpa"
                currentUserName="Sarah (CPA)"
                currentUserId="cpa-123"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Bulk Export Modal */}
      <AnimatePresence>
        {showBulkExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowBulkExportModal(false)} 
                className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={24} />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-[#2E3A59] mb-2">Bulk Export Packages</h3>
                <p className="text-gray-500">Generating financial packages for <span className="font-bold text-[#26A69A]">{selectedClientIds.length}</span> selected clients.</p>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Export Formats</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(exportFormats).map(([key, value]) => (
                      <label key={key} className={cn(
                        "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
                        value ? "border-[#26A69A] bg-[#26A69A]/5 text-[#26A69A]" : "border-gray-100 text-gray-400 hover:border-gray-200"
                      )}>
                        <span className="font-bold text-sm uppercase tracking-tight">{key.replace(/_/g, ' ')}</span>
                        <input 
                          type="checkbox" 
                          checked={value}
                          onChange={() => setFormats(prev => ({ ...prev, [key]: !value }))}
                          className="rounded border-gray-300 text-[#26A69A] focus:ring-[#26A69A]"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Selected Clients</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {clients.filter(c => selectedClientIds.includes(c.id)).map(client => (
                      <div key={client.id} className="flex items-center gap-2 text-sm font-medium text-[#2E3A59]">
                        <div className="w-1.5 h-1.5 bg-[#26A69A] rounded-full" />
                        {client.company_name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleBulkExport}
                disabled={isExporting || Object.values(exportFormats).every(v => !v)}
                className="w-full py-4 bg-[#2E3A59] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#2E3A59]/20 hover:bg-[#1E2A44] transition-all disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                <span>{isExporting ? 'Generating ZIP...' : 'Generate & Download Package'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
