'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCpaPortal = pathname?.startsWith('/cpa-portal');

  if (isCpaPortal) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Navigation />
      <main className="flex-1 pb-20 md:pb-0 md:pl-64 bg-background">
        {children}
      </main>
    </div>
  );
}
