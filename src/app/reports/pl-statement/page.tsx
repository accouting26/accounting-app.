'use client';

import React from 'react';
import ReportHeader from '@/components/ReportHeader';
import ReportFooter from '@/components/ReportFooter';
import ReportTabs from '@/components/ReportTabs';

const revenueItems = [
  { name: 'Product Sales', amount: 45000 },
  { name: 'Service Revenue', amount: 25420 },
  { name: 'Interest Income', amount: 150 },
];

const cogsItems = [
  { name: 'Direct Materials', amount: -8500 },
  { name: 'Direct Labor', amount: -12000 },
];

const expenseItems = [
  { name: 'Advertising & Marketing', amount: -4200 },
  { name: 'Rent', amount: -5600 },
  { name: 'Salaries', amount: -28500 },
  { name: 'Utilities', amount: -1250 },
  { name: 'Office Supplies', amount: -850 },
  { name: 'Insurance', amount: -1680 },
];

export default function ProfitAndLoss() {
  const totalRevenue = revenueItems.reduce((acc, item) => acc + item.amount, 0);
  const totalCOGS = cogsItems.reduce((acc, item) => acc + item.amount, 0);
  const grossProfit = totalRevenue + totalCOGS;
  const totalExpenses = expenseItems.reduce((acc, item) => acc + item.amount, 0);
  const netIncome = grossProfit + totalExpenses;

  const formatCurrency = (val: number) => {
    const absVal = Math.abs(val);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(absVal);
    
    return val < 0 ? `(${formatted})` : formatted;
  };

  const renderRow = (name: string, amount: number, isSubtotal = false, isBold = false) => (
    <div className={`flex justify-between py-3 px-4 ${isSubtotal ? 'bg-gray-50 border-t border-b' : 'even:bg-gray-50/50'}`}>
      <span className={`${isBold ? 'font-bold' : 'font-medium'} text-gray-700`}>{name}</span>
      <span className={`${isBold ? 'font-bold' : 'font-medium'} ${amount < 0 ? 'text-error' : 'text-gray-900'}`}>
        {formatCurrency(amount)}
      </span>
    </div>
  );

  return (
    <div className="bg-white min-h-screen p-12 max-w-4xl mx-auto shadow-2xl my-10 rounded-sm print:shadow-none print:my-0">
      <ReportTabs />
      <ReportHeader 
        reportTitle="Profit & Loss Statement"
        clientName="Sarah the Solopreneur"
        period="January 1, 2026 - March 31, 2026"
      />

      <div className="mt-10">
        <h3 className="bg-primary text-white px-4 py-2 font-bold uppercase text-xs tracking-widest mb-4">Revenue</h3>
        <div className="mb-8">
          {revenueItems.map(item => renderRow(item.name, item.amount))}
          {renderRow('Total Revenue', totalRevenue, true, true)}
        </div>

        <h3 className="bg-gray-200 text-gray-700 px-4 py-2 font-bold uppercase text-xs tracking-widest mb-4">Cost of Goods Sold</h3>
        <div className="mb-8">
          {cogsItems.map(item => renderRow(item.name, item.amount))}
          {renderRow('Total COGS', totalCOGS, true, true)}
        </div>

        <div className="mb-12 bg-indigo-50 border-2 border-primary/20 rounded-lg p-1">
          {renderRow('Gross Profit', grossProfit, false, true)}
        </div>

        <h3 className="bg-gray-200 text-gray-700 px-4 py-2 font-bold uppercase text-xs tracking-widest mb-4">Operating Expenses</h3>
        <div className="mb-8">
          {expenseItems.map(item => renderRow(item.name, item.amount))}
          {renderRow('Total Operating Expenses', totalExpenses, true, true)}
        </div>

        <div className="mt-12 p-6 bg-primary text-white rounded-xl shadow-xl flex justify-between items-center">
          <span className="text-xl font-bold uppercase tracking-widest">Net Income</span>
          <span className="text-3xl font-black border-b-4 border-double border-white/50 pb-1">
            {formatCurrency(netIncome)}
          </span>
        </div>
      </div>

      <ReportFooter />
    </div>
  );
}
