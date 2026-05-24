'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Info, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL } from '@/config';

interface Category {
  id: string;
  name: string;
  irs_code: string;
}

interface Mappings {
  [key: string]: string;
}

export default function DrakeMappingPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [defaults, setDefaults] = useState<Mappings>({});
  const [mappings, setMappings] = useState<Mappings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [catsRes, defsRes, mapsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/transactions/categories`),
        fetch(`${API_BASE_URL}/api/export/drake/defaults`),
        fetch(`${API_BASE_URL}/api/export/drake/mappings?user_id=cpa-123`)
      ]);

      const cats = await catsRes.json();
      const defs = await defsRes.json();
      const maps = await mapsRes.json();

      setCategories(cats);
      setDefaults(defs);
      
      // Initialize mappings with defaults, then override with custom ones
      const initialMappings: Mappings = { ...defs };
      if (Array.isArray(maps)) {
        maps.forEach((m: { category_id: string, drake_account_code: string }) => {
          initialMappings[m.category_id] = m.drake_account_code;
        });
      }
      setMappings(initialMappings);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load mapping data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingChange = (categoryId: string, value: string) => {
    setMappings(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const payload = Object.entries(mappings).map(([categoryId, drakeCode]) => ({
        category_id: categoryId,
        drake_account_code: drakeCode
      }));

      const response = await fetch(`${API_BASE_URL}/api/export/drake/mappings?user_id=cpa-123`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Mappings saved successfully!' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving mappings:', error);
      setMessage({ type: 'error', text: 'Failed to save mappings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setMappings({ ...defaults });
    setMessage({ type: 'success', text: 'Reset to defaults. Don\'t forget to save!' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#26A69A]"></div>
      </div>
    );
  }

  const incomeCategories = categories.filter(c => c.irs_code === 'Income');
  const expenseCategories = categories.filter(c => c.irs_code === 'Expense');

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cpa-portal/settings" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#2E3A59]">Drake Account Mapping</h1>
            <p className="text-gray-500 mt-1">Customize the account codes used in Drake CSV exports.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium border border-gray-200"
          >
            <RefreshCcw size={18} />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-[#26A69A] text-white rounded-xl hover:bg-[#219186] transition-colors font-medium shadow-md disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <Info size={20} />
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#E0E0E0] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E0E0E0] bg-gray-50/50">
          <h2 className="text-xl font-bold text-[#2E3A59]">Income Mappings</h2>
        </div>
        <div className="divide-y divide-[#E0E0E0]">
          {incomeCategories.map((cat) => (
            <div key={cat.id} className="p-4 grid grid-cols-2 items-center hover:bg-gray-50 transition-colors">
              <div className="font-medium text-[#2E3A59]">{cat.name}</div>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={mappings[cat.id] || ''}
                  onChange={(e) => handleMappingChange(cat.id, e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-[#E0E0E0] focus:outline-none focus:border-[#26A69A] focus:ring-2 focus:ring-[#26A69A]/10 font-mono text-sm"
                  placeholder="e.g. INCOME"
                />
                {mappings[cat.id] !== defaults[cat.id] && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase font-bold tracking-wider">Custom</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E0E0E0] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#E0E0E0] bg-gray-50/50">
          <h2 className="text-xl font-bold text-[#2E3A59]">Expense Mappings</h2>
        </div>
        <div className="divide-y divide-[#E0E0E0]">
          {expenseCategories.map((cat) => (
            <div key={cat.id} className="p-4 grid grid-cols-2 items-center hover:bg-gray-50 transition-colors">
              <div className="font-medium text-[#2E3A59]">{cat.name}</div>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={mappings[cat.id] || ''}
                  onChange={(e) => handleMappingChange(cat.id, e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-[#E0E0E0] focus:outline-none focus:border-[#26A69A] focus:ring-2 focus:ring-[#26A69A]/10 font-mono text-sm"
                  placeholder="e.g. 6000"
                />
                {mappings[cat.id] !== defaults[cat.id] && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase font-bold tracking-wider">Custom</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
          <Info size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-blue-900">About Drake Mappings</h4>
          <p className="text-sm text-blue-800/80 leading-relaxed">
            These account codes will be used when generating CSV exports for Drake Software. 
            By default, we use standard IRS-aligned codes (e.g., 6000 for Advertising). 
            If your firm uses a custom Chart of Accounts in Drake, update the codes above to match.
          </p>
        </div>
      </div>
    </div>
  );
}
