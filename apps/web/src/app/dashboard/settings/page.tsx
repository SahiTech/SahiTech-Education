import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { 
  Settings, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  Lock
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        মাদ্রাসা সেটিংস দেখার জন্য অনুগ্রহ করে প্রথমে লগইন করুন।
      </div>
    );
  }

  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', context.tenantId)
    .single();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              মাদ্রাসা প্রাতিষ্ঠানিক সেটিংস ও কনফিগারেশন (Settings)
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              প্রশাসনিক কনফিগারেশন
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · প্রাতিষ্ঠানিক প্রোফাইল, নিরাপত্তা পলিসি এবং শিক্ষানীতি ব্যবস্থাপনা।
          </p>
        </div>

        <Link
          href="/onboarding"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition inline-flex items-center gap-1.5"
        >
          <Sparkles className="h-4 w-4" />
          অনবোর্ডিং উইজার্ড চালু করুন
        </Link>
      </div>

      {/* Madrasa Profile Details */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-emerald-700" />
          প্রাতিষ্ঠানিক পরিচিতি ও পরিচয় (Identity & Branding)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase">মাদ্রাসার পূর্ণ নাম</span>
            <span className="font-semibold text-slate-900 text-base">{tenant?.name}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase">প্রাতিষ্ঠানিক কোড</span>
            <span className="font-mono font-bold text-slate-900">{tenant?.code}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase">সাবডোমেন ও অনলাইন পোর্টাল</span>
            <span className="font-mono text-emerald-700">{tenant?.subdomain}.sahitech-edu.com</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase">পাঠ্যক্রম কাঠামো</span>
            <span className="font-semibold text-slate-900 capitalize">
              {tenant?.curriculum_type === 'qawmi' ? 'কওমি দরসে নেজামী' : 'আলিয়া মাদ্রাসা বোর্ড'}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase">বোর্ড স্বীকৃতি</span>
            <span className="font-semibold text-slate-900">
              {tenant?.board_affiliation || 'বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ'}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase">প্রতিষ্ঠার সন</span>
            <span className="font-mono text-slate-800">{tenant?.established_year || '১৯৮৫'} খ্রি.</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase">যোগাযোগ ফোন</span>
            <span className="font-mono text-slate-700">{tenant?.contact_phone || 'সংযুক্ত নেই'}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase">যোগাযোগ ইমেইল</span>
            <span className="font-mono text-slate-700">{tenant?.contact_email || 'সংযুক্ত নেই'}</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-bold uppercase">অবস্থান জেলা</span>
            <span className="text-slate-800">{tenant?.district || 'ঢাকা'}</span>
          </div>
        </div>

        {tenant?.motto_bn && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400 block font-bold uppercase">প্রাতিষ্ঠানিক মূলমন্ত্র (Motto)</span>
            <p className="text-sm font-serif italic text-emerald-900 mt-1">&ldquo;{tenant.motto_bn}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Security & Multi-Tenancy Architecture Guarantees */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
          নিরাপত্তা ও আর্কিটেকচার সুরক্ষা স্তর (Zero-Trust Security Guarantees)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 space-y-1.5">
            <div className="font-bold text-emerald-950 flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              100% PostgreSQL Row Level Security (RLS)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ডাটাবেজের ৩২টি টেবিলের প্রতিটি সারিতে <code className="bg-emerald-100 px-1 py-0.5 rounded text-[11px]">tenant_id</code> ফিল্টারিং সক্রিয়। কোনো প্রতিষ্ঠান অন্য কোনো প্রতিষ্ঠানের তথ্যে অনুপ্রবেশ করতে পারে না।
            </p>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 space-y-1.5">
            <div className="font-bold text-emerald-950 flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ডকুমেন্ট ২৬ শরীয়াহ তহবিল পৃথকীকরণ (Fund Segregation)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              সাধারণ মাদ্রাসা ফান্ড এবং লিল্লাহ ও যাকাত ফান্ড স্বয়ংক্রিয়ভাবে পৃথক লেজারে সংরক্ষিত। কোনো ভাউচারে শরীয়াহ তহবিল মিশ্রণ স্বয়ংক্রিয়ভাবে ব্লকিং হয়।
            </p>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 space-y-1.5">
            <div className="font-bold text-emerald-950 flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ক্রিপ্টোগ্রাফিক ডিজিটাল সনদ ভেরিফিকেশন (Document 25)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ইস্যুকৃত সকল সনদে ৬৪-বিট অনন্য ডিজিটাল সিগনেচার হ্যাশ জেনারেট হয়, যা কিউআর কোড বা পোর্টালে অনলাইন প্রামাণ্য যাচাইযোগ্য।
            </p>
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 space-y-1.5">
            <div className="font-bold text-emerald-950 flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              অপরিবর্তনযোগ্য অডিট লগিং (Immutable Audit Trail)
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              প্রতিটি সংবেদনশীল পরিবর্তন, ভর্তি, ফল প্রকাশ ও আর্থিক ভাউচার পোস্টের সাথে অপরিবর্তনযোগ্য অডিট এন্ট্রি টাইমস্ট্যাম্পসহ সংরক্ষিত।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
