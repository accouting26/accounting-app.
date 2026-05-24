'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'Executive Summary', href: '/reports/executive-summary' },
  { name: 'Profit & Loss', href: '/reports/pl-statement' },
  { name: 'Balance Sheet', href: '/reports/balance-sheet' },
];

export default function ReportTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-4 mb-8 bg-gray-100 p-1 rounded-xl w-fit mx-auto print:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              isActive 
                ? "bg-white text-primary shadow-sm" 
                : "text-gray-500 hover:text-primary"
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}
