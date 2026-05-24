'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cloud, CheckCircle2, AlertCircle, Loader2, ChevronRight, ArrowLeft, Save, RefreshCw, Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { API_BASE_URL } from '@/config';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExternalAccount {
  external_id: string;
  name: string;
}

interface LocalCategory {
  id: string;
  name: string;
}

interface Mapping {
  local_id: string;
  external_id: string;
  external_name: string;
}

export default function IntegrationsSettingsPage() {
  const [provider, setProvider] = useState<'QBO' | 'XERO' | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [externalAccounts, setExternalAccounts] = useState<ExternalAccount[]>([]);
  const [localCategories, setLocalCategories] = useState<LocalCategory[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({}); // local_id -> external_id
  const [saving, setSaving] = useState(false);

  // Mock User ID for demo
  const userId = "client-123";

  useEffect(() => {
    // Fetch local categories (Mock for now, would be from /api/categories)
    setLocalCategories([
      { id: 'advertising', name: 'Advertising & Marketing' },
      { id: 'office_supplies', name: 'Office Supplies' },
      { id: 'travel', name: 'Travel' },
      { id: 'meals', name: 'Meals & Entertainment' },
      { id: 'rent', name: 'Rent or Lease' },
      { id: 'professional_services', name: 'Professional Services' },
    ]);
  }, []);

  const handleConnect = async (selectedProvider: 'QBO' | 'XERO') => {
    setConnecting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/integrations/${selectedProvider.toLowerCase()}/connect?user_id=${userId}`);
      const data = await res.json();
      
      // In a real app, we would redirect to data.auth_url
      // window.location.href = data.auth_url;
      
      // For demo, we'll simulate a successful callback
      alert(`Redirecting to ${selectedProvider} login...\n(Simulated: Authorization successful)`);
      
      setProvider(selectedProvider);
      fetchExternalAccounts(selectedProvider);
      fetchExistingMappings(selectedProvider);
    } catch (error) {
      console.error(error);
      alert('Failed to connect to provider');
    } finally {
      setConnecting(false);
    }
  };

  const fetchExternalAccounts = async (selectedProvider: 'QBO' | 'XERO') => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/integrations/${selectedProvider.toLowerCase()}/accounts?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setExternalAccounts(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingMappings = async (selectedProvider: 'QBO' | 'XERO') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/integrations/${selectedProvider.toLowerCase()}/mappings?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const mappingObj: Record<string, string> = {};
        data.forEach((m: any) => {
          mappingObj[m.local_id] = m.external_id;
        });
        setMappings(mappingObj);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMappingChange = (localId: string, externalId: string) => {
    setMappings(prev => ({
      ...prev,
      [localId]: externalId
    }));
  };

  const handleSaveMappings = async () => {
    if (!provider) return;
    setSaving(true);
    try {
      const mappingList = Object.entries(mappings).map(([localId, externalId]) => {
        const extAcc = externalAccounts.find(a => a.external_id === externalId);
        return {
          local_id: localId,
          external_id: externalId,
          external_name: extAcc?.name || ''
        };
      });

      const res = await fetch(`${API_BASE_URL}/api/integrations/${provider.toLowerCase()}/mappings?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappingList)
      });

      if (res.ok) {
        alert('Mappings saved successfully!');
      } else {
        throw new Error('Failed to save mappings');
      }
    } catch (error) {
      console.error(error);
      alert('Error saving mappings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <header className="mb-10 flex items-center gap-4">
        <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">INTEGRATIONS</h1>
          <p className="text-gray-500">Sync your confirmed transactions to accounting software</p>
        </div>
      </header>

      {!provider ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all">
            <div className="w-20 h-20 bg-[#2CA01C]/10 rounded-2xl flex items-center justify-center mb-6">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/QuickBooks_logo.svg/2560px-QuickBooks_logo.svg.png" 
                alt="QuickBooks" 
                className="w-12 h-12 object-contain" 
              />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">QuickBooks Online</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Automatically push confirmed expenses and receipts directly into your QBO account.
            </p>
            <button 
              onClick={() => handleConnect('QBO')}
              disabled={connecting}
              className="w-full py-4 bg-[#2CA01C] text-white rounded-xl font-bold hover:bg-[#238016] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {connecting ? <Loader2 className="animate-spin" size={20} /> : <LinkIcon size={20} />}
              <span>Connect QuickBooks</span>
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all">
            <div className="w-20 h-20 bg-[#13B5EA]/10 rounded-2xl flex items-center justify-center mb-6">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Xero_logo.svg/2560px-Xero_logo.svg.png" 
                alt="Xero" 
                className="w-12 h-12 object-contain" 
              />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Xero</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              Sync bank transactions and contacts to your Xero organization seamlessly.
            </p>
            <button 
              onClick={() => handleConnect('XERO')}
              disabled={connecting}
              className="w-full py-4 bg-[#13B5EA] text-white rounded-xl font-bold hover:bg-[#0f96c3] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {connecting ? <Loader2 className="animate-spin" size={20} /> : <LinkIcon size={20} />}
              <span>Connect Xero</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                provider === 'QBO' ? "bg-[#2CA01C]/10" : "bg-[#13B5EA]/10"
              )}>
                <img 
                  src={provider === 'QBO' 
                    ? "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/QuickBooks_logo.svg/2560px-QuickBooks_logo.svg.png" 
                    : "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Xero_logo.svg/2560px-Xero_logo.svg.png"
                  } 
                  className="w-8 h-8 object-contain" 
                  alt={provider}
                />
              </div>
              <div>
                <h3 className="font-bold text-primary">{provider === 'QBO' ? 'QuickBooks Online' : 'Xero'}</h3>
                <div className="flex items-center gap-1.5 text-xs text-success font-bold uppercase tracking-wider">
                  <CheckCircle2 size={12} />
                  Connected
                </div>
              </div>
            </div>
            <button 
              onClick={() => setProvider(null)}
              className="text-sm font-bold text-error hover:underline"
            >
              Disconnect
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-primary">Account Mapping</h2>
                <p className="text-sm text-gray-500">Map your tax categories to your external Chart of Accounts</p>
              </div>
              <button 
                onClick={() => fetchExternalAccounts(provider)}
                className="p-2 text-gray-400 hover:text-primary transition-colors"
                title="Refresh Accounts"
              >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-secondary" size={40} />
                <p className="text-gray-400 font-medium">Fetching Chart of Accounts...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="px-8 py-4">Local Category</th>
                      <th className="px-8 py-4">External Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {localCategories.map((category) => (
                      <tr key={category.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-bold text-primary">{category.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{category.id}</p>
                        </td>
                        <td className="px-8 py-5">
                          <select 
                            value={mappings[category.id] || ''}
                            onChange={(e) => handleMappingChange(category.id, e.target.value)}
                            className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-secondary transition-all text-sm font-medium text-primary appearance-none cursor-pointer"
                          >
                            <option value="">Select an account...</option>
                            {externalAccounts.map((acc) => (
                              <option key={acc.external_id} value={acc.external_id}>
                                {acc.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSaveMappings}
                disabled={saving || loading}
                className="bg-primary text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                <span>Save Mappings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
