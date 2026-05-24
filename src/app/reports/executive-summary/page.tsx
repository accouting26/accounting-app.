'use client';

import React from 'react';
import ReportHeader from '@/components/ReportHeader';
import ReportFooter from '@/components/ReportFooter';
import ReportTabs from '@/components/ReportTabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { Lightbulb } from 'lucide-react';

const spendingData = [
  { name: 'Rent', amount: 5600 },
  { name: 'Salaries', amount: 7000 },
  { name: 'Utilities', amount: 5500 },
  { name: 'Marketing', amount: 4200 },
  { name: 'Software', amount: 3100 },
];

const gaugeData = [
  { value: 75, fill: '#26A69A' },
  { value: 25, fill: '#E0E0E0' }
];

export default function ExecutiveSummary() {
  const primaryColor = "#2E3A59";
  const accentColor = "#26A69A";

  return (
    <div className="bg-white min-h-screen p-8 max-w-4xl mx-auto shadow-2xl my-10 rounded-sm print:shadow-none print:my-0">
      <ReportTabs />
      <ReportHeader 
        reportTitle="Executive Financial Summary"
        clientName="Sarah the Solopreneur"
        period="January 1, 2026 - March 31, 2026"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        {/* Gauge Section */}
        <div className="text-center">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6 text-left">Cash Flow Health</h3>
          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-0 text-5xl font-bold text-primary">75</div>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-600">Cash Flow Health</p>
        </div>

        {/* Bar Chart Section */}
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Top Spending Categories</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4A4A4A' }} />
                <Bar dataKey="amount" fill={accentColor} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tax Savings Spotlight */}
      <div className="bg-secondary p-8 rounded-xl text-white mb-10 shadow-lg shadow-secondary/20">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Tax Savings Opportunity</h3>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xs">Estimate</span>
          <span className="text-4xl font-bold">$12,000</span>
        </div>
        <p className="text-lg opacity-90">Reduce tax liability by increasing retirement contributions</p>
      </div>

      {/* AI Intelligence Note */}
      <div className="flex gap-6 items-start p-6 bg-gray-50 rounded-xl border border-gray-100">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
          <Lightbulb size={24} />
        </div>
        <div>
          <h3 className="font-bold text-primary uppercase text-xs tracking-wider mb-2">AI Intelligence Note</h3>
          <p className="text-gray-600 leading-relaxed">
            Your subscription costs increased by 10% this month; consider a review of recurring payments to optimize your SaaS spend.
          </p>
        </div>
      </div>

      <ReportFooter />
    </div>
  );
}
