import React from 'react';
import Link from 'next/link';
import { Users, Search, Filter, Plus, Home, HeartHandshake, Phone } from 'lucide-react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface StudentsDirectoryProps {
  searchParams: Promise<{
    search?: string;
    residential?: string;
  }>;
}

export default async function StudentsDirectoryPage({ searchParams }: StudentsDirectoryProps) {
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        শিক্ষার্থী তালিকা দেখার জন্য প্রথমে আপনার মাদরাসা নির্বাচন অথবা নিবন্ধন সম্পন্ন করুন।
      </div>
    );
  }

  const { search, residential } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('students')
    .select(`
      id,
      admission_no,
      full_name_bn,
      full_name_en,
      guardian_phone,
      is_residential,
      is_lillah_boarder,
      gender,
      admission_date,
      created_at
    `)
    .eq('tenant_id', context.tenantId)
    .order('created_at', { ascending: false });

  if (search?.trim()) {
    const s = `%${search.trim()}%`;
    query = query.or(`full_name_bn.ilike.${s},full_name_en.ilike.${s},admission_no.ilike.${s},guardian_phone.ilike.${s}`);
  }

  if (residential === 'yes') {
    query = query.eq('is_residential', true);
  } else if (residential === 'no') {
    query = query.eq('is_residential', false);
  }

  const { data: students, error } = await query;
  const studentList = students || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              শিক্ষার্থী ও ছাত্রাবাস রেজিস্ট্রি (Students & SIS)
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-700">
              মোট: {studentList.length} জন
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · তালিবুল ইলমদের ডাটাবেজ, আবাসিক অবস্থা ও লিল্লাহ বোর্ডিং ট্র্যাকিং।
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/admissions"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            ভর্তি আবেদনসমূহ
          </Link>
          <Link
            href="/dashboard/students/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
          >
            <Plus className="h-4 w-4" />
            নতুন ভর্তি (New Admission)
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form method="GET" className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            name="search"
            defaultValue={search || ''}
            placeholder="নাম, দাখেলা নং বা মোবাইল দিয়ে খুঁজুন..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>

        <select
          name="residential"
          defaultValue={residential || ''}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-emerald-600 focus:outline-none"
        >
          <option value="">সকল আবাসন অবস্থা</option>
          <option value="yes">শুধু আবাসিক</option>
          <option value="no">শুধু অনাবাসিক</option>
        </select>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          ফিল্টার করুন
        </button>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {studentList.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-800">কোনো শিক্ষার্থী পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || residential 
                ? 'আপনার প্রদত্ত ফিল্টারে কোনো ফলাফল মিলেনি।'
                : 'আপনার মাদরাসায় এখনো কোনো শিক্ষার্থী ভর্তি করা হয়নি। এখনই নতুন শিক্ষার্থী অন্তর্ভুক্ত করুন।'}
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/students/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                নতুন শিক্ষার্থী ভর্তি করুন
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">ভর্তি নং</th>
                  <th className="px-5 py-3">শিক্ষার্থীর নাম</th>
                  <th className="px-5 py-3">অভিভাবকের মোবাইল</th>
                  <th className="px-5 py-3">আবাসিক অবস্থা</th>
                  <th className="px-5 py-3">লিল্লাহ বোর্ডিং</th>
                  <th className="px-5 py-3 text-right">ভর্তির তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentList.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900">
                      {st.admission_no}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{st.full_name_bn}</div>
                      <div className="text-xs text-slate-500">{st.full_name_en}</div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{st.guardian_phone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {st.is_residential ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200/60">
                          <Home className="h-3 w-3" />
                          আবাসিক
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          অনাবাসিক
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {st.is_lillah_boarder ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 border border-purple-200/60">
                          <HeartHandshake className="h-3 w-3 text-purple-600" />
                          লিল্লাহ প্রাপক
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">সাধারণ</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-500">
                      {new Date(st.admission_date || st.created_at).toLocaleDateString('bn-BD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
