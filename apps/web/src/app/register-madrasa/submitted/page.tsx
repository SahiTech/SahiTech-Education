import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function ApplicationSubmittedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-lg w-full rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">আবেদন গ্রহণ করা হয়েছে</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          আপনার মাদরাসার আবেদন MDI Platform Owner-এর পর্যালোচনার জন্য জমা হয়েছে।
          যাচাই ও অনুমোদনের আগে কোনো tenant account বা active portal তৈরি হবে না।
          অনুমোদিত হলে প্রদত্ত ইমেইলে invitation পাঠানো হবে।
        </p>
        <Link href="/" className="mt-7 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">
          মূল পাতায় ফিরে যান
        </Link>
      </div>
    </div>
  );
}
