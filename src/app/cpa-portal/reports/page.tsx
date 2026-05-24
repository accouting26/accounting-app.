'use client';

import React from 'react';
import { FileText, Download, Filter } from 'lucide-react';

export default function CpaReports() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#2E3A59]">Client Reports</h1>
          <p className="text-gray-500 mt-1">Generate and download financial packages for your linked clients.</p>
        </div>
        <button className="bg-[#2E3A59] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#1E2A44] transition-all shadow-lg shadow-[#2E3A59]/20">
          <Filter size={20} />
          <span>Filter Clients</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E0E0E0] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-[#E0E0E0] bg-[#F1F3F5]">
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Client Name</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Generated</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F3F5]">
            {[
              { name: 'ACME Corp.', date: 'May 01, 2026' },
              { name: 'Beta Industries', date: 'Apr 15, 2026' },
              { name: 'Gamma LLC', date: 'Never' },
            ].map((report, idx) => (
              <tr key={idx} className="hover:bg-[#EBF5FB] transition-colors">
                <td className="px-8 py-4 font-medium text-[#2E3A59]">{report.name}</td>
                <td className="px-8 py-4 text-sm text-gray-500">{report.date}</td>
                <td className="px-8 py-4 text-right">
                  <button className="text-[#26A69A] font-bold text-sm flex items-center gap-2 ml-auto hover:underline">
                    <Download size={16} />
                    Generate Package
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
