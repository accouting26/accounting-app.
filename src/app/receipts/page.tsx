'use client';

import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, Clock } from 'lucide-react';

export default function Receipts() {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-primary">RECEIPTS</h1>
          <p className="text-gray-500 mt-2">Snap and match your business expenses.</p>
        </div>
        <button className="bg-secondary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20">
          <Camera size={20} />
          <span>Snap Receipt</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center cursor-pointer hover:border-secondary/50 hover:bg-secondary/5 transition-all group">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-secondary/10 transition-colors">
            <Upload className="text-gray-400 group-hover:text-secondary transition-colors" />
          </div>
          <h3 className="font-bold text-primary">Upload from Device</h3>
          <p className="text-sm text-gray-500 mt-1">Drag and drop or click to browse</p>
        </div>

        <div className="bg-primary p-8 rounded-2xl text-white flex flex-col justify-between shadow-xl shadow-primary/20">
          <div>
            <h3 className="font-bold text-xl mb-2">Auto-Matching</h3>
            <p className="text-sm text-indigo-200">Our AI automatically matches your receipts to bank transactions within seconds.</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-secondary font-bold">
            <CheckCircle2 size={20} />
            <span>98% Accuracy Rate</span>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-primary mb-6">Recent Uploads</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {[
          { id: 1, merchant: 'Staples', date: 'Apr 26, 2026', amount: 45.20, status: 'Matched' },
          { id: 2, merchant: 'Shell Gas', date: 'Apr 25, 2026', amount: 62.00, status: 'Processing' },
          { id: 3, merchant: 'Best Buy', date: 'Apr 22, 2026', amount: 129.99, status: 'Matched' },
        ].map((receipt) => (
          <div key={receipt.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-400">
                IMG
              </div>
              <div>
                <h4 className="font-bold text-primary">{receipt.merchant}</h4>
                <p className="text-xs text-gray-500">{receipt.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="font-bold text-primary">${receipt.amount.toFixed(2)}</p>
                <div className="flex items-center gap-1 justify-end">
                  {receipt.status === 'Matched' ? (
                    <>
                      <CheckCircle2 size={12} className="text-success" />
                      <span className="text-[10px] text-success font-medium">Matched</span>
                    </>
                  ) : (
                    <>
                      <Clock size={12} className="text-secondary" />
                      <span className="text-[10px] text-secondary font-medium">Processing</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
