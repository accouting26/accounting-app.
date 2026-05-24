'use client';

import React from 'react';

interface ReportHeaderProps {
  logoUrl?: string;
  firmName?: string;
  reportTitle: string;
  clientName: string;
  period: string;
  primaryColor?: string;
}

export default function ReportHeader({
  logoUrl,
  firmName = "CPA FIRM LOGO",
  reportTitle,
  clientName,
  period,
  primaryColor = "#2E3A59"
}: ReportHeaderProps) {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="mb-10 border-b pb-6">
      <div className="flex justify-between items-start mb-8">
        <div className="max-h-[60px]">
          {logoUrl ? (
            <img src={logoUrl} alt={firmName} className="max-h-[60px] object-contain" />
          ) : (
            <div className="text-xl font-bold text-gray-400 uppercase tracking-tight">
              {firmName}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-700">{clientName}</div>
          <div className="text-sm text-gray-500">Period: {period}</div>
          <div className="text-sm text-gray-400 mt-1">Generated: {generatedDate}</div>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ color: primaryColor }}>
        {reportTitle}
      </h1>
    </div>
  );
}
