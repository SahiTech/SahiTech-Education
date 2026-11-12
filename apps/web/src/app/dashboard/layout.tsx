import React from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-8 bg-slate-50 min-h-[calc(100vh-4rem)]">
        {children}
      </div>
    </div>
  );
}

