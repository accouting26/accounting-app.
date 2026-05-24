'use client';

import React from 'react';
import { User, Bell, Shield, CreditCard, LogOut, Cloud } from 'lucide-react';
import Link from 'next/link';

export default function Settings() {
  const sections = [
    { name: 'Profile', icon: User, description: 'Manage your personal information', href: '/settings/profile' },
    { name: 'Integrations', icon: Cloud, description: 'Connect QuickBooks or Xero', href: '/settings/integrations' },
    { name: 'Notifications', icon: Bell, description: 'Configure alert preferences', href: '/settings/notifications' },
    { name: 'Security', icon: Shield, description: 'Update password and security settings', href: '/settings/security' },
    { name: 'Billing', icon: CreditCard, description: 'Manage subscription and payment methods', href: '/settings/billing' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-primary">SETTINGS</h1>
      </header>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link 
              key={section.name} 
              href={section.href}
              className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-primary">{section.name}</h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              <div className="text-gray-300 group-hover:text-primary transition-colors">
                →
              </div>
            </Link>
          );
        })}

        <button className="w-full mt-10 p-6 rounded-2xl border border-error/20 bg-error/5 text-error font-bold flex items-center justify-center gap-2 hover:bg-error/10 transition-colors">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
