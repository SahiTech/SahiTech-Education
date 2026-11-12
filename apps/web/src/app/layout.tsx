import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'SahiTech MDI — Madrasa Digitalization Initiative',
  description: 'Enterprise Hybrid Multi-Tenant Management Operating System for Qawmi & Alia Madrasas by SahiTech Education',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" dir="ltr">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

