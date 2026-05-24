'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, LayoutDashboard, Receipt, Settings, FileText, MessageSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Inbox', href: '/', icon: Inbox },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Messages', href: '/messages', icon: MessageSquare, badge: 1 },
  { name: 'Receipts', href: '/receipts', icon: Receipt },
  { name: 'Reports', href: '/reports/executive-summary', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 md:top-0 md:bottom-auto md:left-0 md:right-auto md:w-64 md:h-screen md:flex-col md:border-t-0 md:border-r md:items-start md:py-10">
      <div className="hidden md:block mb-10 px-4">
        <h1 className="text-xl font-bold text-primary">Accounting</h1>
        <p className="text-xs text-gray-500">at your Service</p>
      </div>
      
      <div className="flex md:flex-col justify-between w-full md:gap-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 rounded-lg transition-colors w-full relative",
                isActive 
                  ? "text-secondary bg-secondary/10" 
                  : "text-gray-500 hover:text-primary hover:bg-gray-100"
              )}
            >
              <Icon size={24} />
              <span className="text-[10px] md:text-sm font-medium">{item.name}</span>
              {item.badge && !isActive && (
                <span className="absolute top-1 right-1 md:right-auto md:left-[160px] md:top-3 bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
