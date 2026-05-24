'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, AlertCircle, Download, Loader2, ArrowRight, ShieldCheck, Clock, FileArchive
} from 'lucide-react';
import Link from 'next/link';

import ReferralLeaderboard from '@/components/ReferralLeaderboard';
import { API_BASE_URL } from '@/config';

interface Client {
  id: string;
  email: string;
  company_name: string;
  total_confirmed_transactions: number;
  total_unprocessed_transactions: number;
  is_paid: boolean;
  subscription_status: string;
}

export default function CentralizedDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/cpa/clients?cpa_id=cpa-123`);
        if (!res.ok) throw new Error('Failed to fetch clients');
        const data = await res.json();
        setClients(data);
      } catch (error) {
        console.error(error);
        // Fallback mock data
        setClients([
          { id: '1', email: 'acme@example.com', company_name: 'ACME Corp.', total_confirmed_transactions: 145, total_unprocessed_transactions: 0, is_paid: true, subscription_status: 'business' },
          { id: '2', email: 'beta@example.com', company_name: 'Beta Industries', total_confirmed_transactions: 89, total_unprocessed_transactions: 12, is_paid: false, subscription_status: 'free' },
          { id: '3', email: 'gamma@example.com', company_name: 'Gamma LLC', total_confirmed_transactions: 210, total_unprocessed_transactions: 5, is_paid: true, subscription_status: 'business' },
          { id: '4', email: 'delta@example.com', company_name: 'Delta Co.', total_confirmed_transactions: 56, total_unprocessed_transactions: 2, is_paid: false, subscription_status: 'free' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const totalClients = clients.length;
  const upToDateClients = clients.filter(c => c.total_unprocessed_transactions === 0).length;
  const pendingClients = totalClients - upToDateClients;
  const totalUnprocessed = clients.reduce((acc, c) => acc + c.total_unprocessed_transactions, 0);

  const handleDownloadExport = (clientId: string, type: 'schedule_c' | 'trial_balance') => {
    const url = `${API_BASE_URL}/api/export/drake/${type}?user_id=${clientId}`;
    window.open(url, '_blank');
  };

  const handleBulkDownload = async () => {
    setBulkDownloading(true);
    try {
      // Assuming the backend endpoint will be something like this
      // The SSE is currently working on this in task cf6bdf44-f524-4290-858a-24545a772ab5
      const url = `${API_BASE_URL}/api/cpa/bulk-download-zip?cpa_id=cpa-123`;
      window.open(url, '_blank');
      
      // Simulate wait if we were doing a real fetch
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(error);
      alert('Bulk download failed. The export engine is still being finalized.');
    } finally {
      setBulkDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)]">
        <Loader2 className="animate-spin text-[#26A69A]" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#2E3A59]">Firm Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here is a summary of your linked clients.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBulkDownload}
            disabled={bulkDownloading}
            className="bg-[#26A69A] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#1E867D] transition-all shadow-lg shadow-[#26A69A]/20 disabled:opacity-50"
          >
            {bulkDownloading ? <Loader2 className="animate-spin" size={20} /> : <FileArchive size={20} />}
            <span>Bulk Download All Packages (.zip)</span>
          </button>
          <div className="bg-[#EBF5FB] px-4 py-2 rounded-lg flex items-center gap-2 border border-[#AED6F1]">
            <ShieldCheck className="text-[#26A69A]" size={20} />
            <span className="text-sm font-bold text-[#2E3A59]">Founder's Circle Partner</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="text-blue-500" size={20} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Clients</p>
          </div>
          <h4 className="text-3xl font-bold text-[#2E3A59]">{totalClients}</h4>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="text-[#66BB6A]" size={20} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Up to Date</p>
          </div>
          <h4 className="text-3xl font-bold text-[#2E3A59]">{upToDateClients}</h4>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <AlertCircle className="text-[#FF7043]" size={20} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Needs Attention</p>
          </div>
          <h4 className="text-3xl font-bold text-[#2E3A59]">{pendingClients}</h4>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Clock className="text-purple-500" size={20} />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Trans.</p>
          </div>
          <h4 className="text-3xl font-bold text-[#2E3A59]">{totalUnprocessed}</h4>
        </div>
      </div>

      <ReferralLeaderboard />

      {/* Client Status Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E0E0E0] overflow-hidden">
        <div className="p-6 border-b border-[#F1F3F5] flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#2E3A59]">Client Health & Exports</h2>
          <Link href="/cpa-portal/clients" className="text-[#26A69A] font-bold text-sm flex items-center gap-1 hover:underline">
            View Individual Details <ArrowRight size={16} />
          </Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-[#E0E0E0] bg-gray-50">
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Company Name</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Confirmed</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Quick Actions (Drake Tax)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F3F5]">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#2E3A59]">{client.company_name}</p>
                    {client.is_paid && (
                      <span className="text-[10px] bg-green-100 text-[#26A69A] px-2 py-0.5 rounded font-bold uppercase tracking-tight">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{client.email}</p>
                </td>
                <td className="px-8 py-4">
                  {client.total_unprocessed_transactions > 0 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-[#FF7043] text-xs font-bold">
                      <AlertCircle size={12} />
                      {client.total_unprocessed_transactions} pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-[#66BB6A] text-xs font-bold">
                      <CheckCircle2 size={12} />
                      Up to date
                    </span>
                  )}
                </td>
                <td className="px-8 py-4 text-right font-medium text-[#2E3A59]">
                  {client.total_confirmed_transactions}
                </td>
                <td className="px-8 py-4">
                  <div className="flex justify-center gap-3">
                    <button 
                      onClick={() => handleDownloadExport(client.id, 'schedule_c')}
                      className="text-xs font-bold bg-[#2E3A59] text-white px-3 py-2 rounded-lg hover:bg-[#1E2A44] transition-all flex items-center gap-2"
                    >
                      <Download size={14} />
                      Schedule C
                    </button>
                    <button 
                      onClick={() => handleDownloadExport(client.id, 'trial_balance')}
                      className="text-xs font-bold border border-[#2E3A59] text-[#2E3A59] px-3 py-2 rounded-lg hover:bg-[#2E3A59] hover:text-white transition-all flex items-center gap-2"
                    >
                      <Download size={14} />
                      Trial Balance
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
