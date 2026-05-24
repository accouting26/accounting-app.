import React from 'react';
import CpaSidebar from '@/components/CpaSidebar';

export default function CpaPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <CpaSidebar />
      <main className="flex-1 ml-[260px] min-h-screen">
        <header className="h-16 bg-white border-b border-[#E0E0E0] sticky top-0 z-10 flex items-center px-8 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
            <span>Portal</span>
            <span className="text-gray-300">/</span>
            <span className="text-[#2E3A59]">Dashboard</span>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
