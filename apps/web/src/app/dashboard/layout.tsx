import React from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)]">
        <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-[calc(100vh-4rem)] w-full max-w-full overflow-x-hidden">
            {children}
      </main>
    </div>
  );
}
