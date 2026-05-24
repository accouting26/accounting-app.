'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, FileText, Settings, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Overview', href: '/cpa-portal', icon: LayoutDashboard },
  { name: 'Clients', href: '/cpa-portal/clients', icon: Users },
  { name: 'Messages', href: '/cpa-portal/messages', icon: MessageSquare, badge: 2 },
  { name: 'Reports', href: '/cpa-portal/reports', icon: FileText },
  { name: 'Settings', href: '/cpa-portal/settings', icon: Settings },
];

export default function CpaSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] h-screen bg-[#2E3A59] text-white flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="p-8">
        <h1 className="text-xl font-bold tracking-tight">Accounting</h1>
        <p className="text-xs text-[#26A69A] font-medium uppercase tracking-widest mt-1">CPA PARTNER PORTAL</p>
      </div>

      <nav className="flex-1 px-4 mt-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-[#26A69A] text-white shadow-lg shadow-[#26A69A]/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={cn(isActive ? "text-white" : "text-gray-400 group-hover:text-white")} />
                  <span className="font-medium">{item.name}</span>
                </div>
                {item.badge && !isActive && (
                  <span className="bg-[#26A69A] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 mt-auto border-t border-white/10">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all w-full text-left">
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
