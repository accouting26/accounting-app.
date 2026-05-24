'use client';

import React from 'react';
import ReportHeader from '@/components/ReportHeader';
import ReportFooter from '@/components/ReportFooter';
import ReportTabs from '@/components/ReportTabs';

const assets = {
  current: [
    { name: 'Cash and Cash Equivalents', amount: 45000 },
    { name: 'Accounts Receivable', amount: 12500 },
    { name: 'Inventory', amount: 8400 },
    { name: 'Prepaid Expenses', amount: 2100 },
  ],
  fixed: [
    { name: 'Office Equipment', amount: 15000 },
    { name: 'Accumulated Depreciation', amount: -3500 },
    { name: 'Computer Hardware', amount: 8000 },
  ]
};

const liabilities = {
  current: [
    { name: 'Accounts Payable', amount: 4200 },
    { name: 'Short-term Loans', amount: 10000 },
    { name: 'Accrued Liabilities', amount: 1500 },
  ],
  longTerm: [
    { name: 'Business Mortgage', amount: 45000 },
    { name: 'SBA Loan', amount: 12000 },
  ]
};

const equity = [
  { name: 'Owner Investment', amount: 20000 },
  { name: 'Retained Earnings', amount: -4200 },
];

export default function BalanceSheet() {
  const currentAssetsTotal = assets.current.reduce((acc, item) => acc + item.amount, 0);
  const fixedAssetsTotal = assets.fixed.reduce((acc, item) => acc + item.amount, 0);
  const totalAssets = currentAssetsTotal + fixedAssetsTotal;

  const currentLiabilitiesTotal = liabilities.current.reduce((acc, item) => acc + item.amount, 0);
  const longTermLiabilitiesTotal = liabilities.longTerm.reduce((acc, item) => acc + item.amount, 0);
  const totalLiabilities = currentLiabilitiesTotal + longTermLiabilitiesTotal;

  const totalEquity = equity.reduce((acc, item) => acc + item.amount, 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const renderSectionHeader = (title: string) => (
    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary border-b-2 border-primary mb-4 pb-1 mt-10">
      {title}
    </h3>
  );

  const renderRow = (name: string, amount: number, indent = false, isBold = false) => (
    <div className={`flex justify-between py-2 border-b border-gray-50 ${indent ? 'pl-8' : ''} ${isBold ? 'font-bold text-gray-900 bg-gray-50/50' : 'text-gray-600'}`}>
      <span>{name}</span>
      <span>{formatCurrency(amount)}</span>
    </div>
  );

  return (
    <div className="bg-white min-h-screen p-12 max-w-4xl mx-auto shadow-2xl my-10 rounded-sm print:shadow-none print:my-0">
      <ReportTabs />
      <ReportHeader 
        reportTitle="Balance Sheet"
        clientName="Sarah the Solopreneur"
        period="As of March 31, 2026"
      />

      <div>
        {renderSectionHeader('Assets')}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-4">Current Assets</p>
        {assets.current.map(item => renderRow(item.name, item.amount, true))}
        {renderRow('Total Current Assets', currentAssetsTotal, false, true)}

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-4 mt-6">Fixed Assets</p>
        {assets.fixed.map(item => renderRow(item.name, item.amount, true))}
        {renderRow('Total Fixed Assets', fixedAssetsTotal, false, true)}

        <div className="mt-8 bg-primary text-white p-4 rounded flex justify-between items-center shadow-lg">
          <span className="font-bold uppercase tracking-widest">Total Assets</span>
          <span className="text-2xl font-black">{formatCurrency(totalAssets)}</span>
        </div>

        {renderSectionHeader('Liabilities')}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-4">Current Liabilities</p>
        {liabilities.current.map(item => renderRow(item.name, item.amount, true))}
        {renderRow('Total Current Liabilities', currentLiabilitiesTotal, false, true)}

        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-4 mt-6">Long-Term Liabilities</p>
        {liabilities.longTerm.map(item => renderRow(item.name, item.amount, true))}
        {renderRow('Total Long-Term Liabilities', longTermLiabilitiesTotal, false, true)}

        {renderSectionHeader('Equity')}
        {equity.map(item => renderRow(item.name, item.amount, true))}
        {renderRow('Total Equity', totalEquity, false, true)}

        <div className="mt-8 bg-gray-900 text-white p-4 rounded flex justify-between items-center shadow-lg">
          <span className="font-bold uppercase tracking-widest">Total Liabilities & Equity</span>
          <span className="text-2xl font-black">{formatCurrency(totalLiabilitiesAndEquity)}</span>
        </div>

        {totalAssets === totalLiabilitiesAndEquity && (
          <div className="mt-6 text-center text-success font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full"></span>
            Balance Check Passed
          </div>
        )}
      </div>

      <ReportFooter />
    </div>
  );
}
