import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { getServerLocale, getServerDirection } from '@/lib/i18n/server';
import { I18nProvider } from '@/lib/i18n';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: {
    template: '%s | SahiTech Education',
    default: 'SahiTech Education | Madrasa Digitalization Initiative',
  },
  description: 'A digital institutional platform by SahiTech Education supporting Qawmi and Alia madrasa administration, academic workflows, student records, and digital Sanad verification.',
  keywords: [
    'Madrasa Management System',
    'Dars-e-Nizami',
    'Befaqul Madaris',
    'Qawmi Madrasa Software',
    'Alia Madrasa Software',
    'Islamic Education ERP',
    'SahiTech Education',
    'Digital Sanad Verification'
  ],
  authors: [{ name: 'SahiTech Education' }],
  creator: 'SahiTech Education',
  metadataBase: new URL('https://sahitech.dpdns.org'),
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    alternateLocale: ['en_US', 'ar_SA'],
    url: 'https://sahitech.dpdns.org',
    siteName: 'SahiTech Education',
    title: 'SahiTech Education | Madrasa Digitalization Initiative',
    description: 'A digital institutional platform supporting Qawmi and Alia madrasa administration and academic workflows.',
    images: [
      {
        url: '/images/hero-campus.jpg',
        width: 1200,
        height: 630,
        alt: 'SahiTech Education MDI Campus',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

  export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: '#174c3d',
  };

  export default async function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const locale = await getServerLocale();
    const direction = await getServerDirection();

    return (
          <html lang={locale} dir={direction} suppressHydrationWarning>
            <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
              <I18nProvider initialLocale={locale}>
                <Navbar />
                <main className="flex-1">{children}</main>
              </I18nProvider>
              <Analytics />
            </body>
          </html>
          );
}
