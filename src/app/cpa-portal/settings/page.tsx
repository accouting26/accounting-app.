'use client';

import React from 'react';
import { Settings, Shield, Bell, CreditCard } from 'lucide-react';

import Link from 'next/link';

export default function CpaSettings() {
  const sections = [
    { name: 'Firm Profile', icon: Settings, description: 'Manage your CPA firm details and logo', href: '#' },
    { name: 'Team Access', icon: Shield, description: 'Manage staff accounts and permissions', href: '#' },
    { name: 'Export Configuration', icon: Settings, description: 'Customize Drake Software account mapping', href: '/cpa-portal/settings/drake-mapping' },
    { name: 'Client Notifications', icon: Bell, description: 'Configure alerts for client data updates', href: '#' },
    { name: 'Firm Subscription', icon: CreditCard, description: 'Manage your partner plan', href: '#' },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#2E3A59]">Portal Settings</h1>
        <p className="text-gray-500 mt-1">Manage your firm's presence and team permissions on the platform.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const content = (
            <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#F1F3F5] rounded-xl flex items-center justify-center text-[#BDBDBD] group-hover:bg-[#26A69A]/10 group-hover:text-[#26A69A] transition-colors">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-[#2E3A59]">{section.name}</h3>
                  <p className="text-sm text-gray-500">{section.description}</p>
                </div>
              </div>
              <div className="text-gray-300 group-hover:text-[#2E3A59] transition-all transform group-hover:translate-x-1">
                →
              </div>
            </div>
          );

          if (section.href !== '#') {
            return (
              <Link key={section.name} href={section.href}>
                {content}
              </Link>
            );
          }

          return <div key={section.name}>{content}</div>;
        })}
      </div>
    </div>
  );
}
