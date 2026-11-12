import React from 'react';
import { Users, Search, Filter, Plus, Home, HeartHandshake } from 'lucide-react';

export default function StudentsDirectoryPage() {
  const dummyStudents = [
    {
      admissionNo: 'ADM-2026-001',
      nameBn: 'মুহাম্মদ আব্দুল্লাহ',
      nameEn: 'Muhammad Abdullah',
      marhala: 'দাওরায়ে হাদীস',
      roll: 1,
      guardianPhone: '01711-000001',
      isResidential: true,
      isLillah: false
    },
    {
      admissionNo: 'ADM-2026-002',
      nameBn: 'মাহমুদুল হাসান',
      nameEn: 'Mahmudul Hasan',
      marhala: 'মারহালাতুল ফযীলত (মিশকাত)',
      roll: 2,
      guardianPhone: '01811-000002',
      isResidential: true,
      isLillah: true
    },
    {
      admissionNo: 'ADM-2026-003',
      nameBn: 'আহমাদ উল্লাহ',
      nameEn: 'Ahmad Ullah',
      marhala: 'হিফজুল কুরআন',
      roll: 5,
      guardianPhone: '01911-000003',
      isResidential: false,
      isLillah: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            শিক্ষার্থী ও ছাত্রাবাস রেজিস্ট্রি (Students & SIS)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            তালিবুল ইলমদের ডাটাবেজ, আবাসিক অবস্থা ও লিল্লাহ বোর্ডিং ট্র্যাকিং।
          </p>
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition">
          <Plus className="h-4 w-4" />
          নতুন ভর্তি (New Admission)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="নাম, দাখেলা নং বা মোবাইল দিয়ে খুঁজুন..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          ফিল্টার (Filter)
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">ভর্তি নং ও রোল</th>
              <th className="px-5 py-3">শিক্ষার্থীর নাম</th>
              <th className="px-5 py-3">মারহালা / শ্রেণি</th>
              <th className="px-5 py-3">অভিভাবকের মোবাইল</th>
              <th className="px-5 py-3">আবাসিক অবস্থা</th>
              <th className="px-5 py-3 text-right">কার্যক্রম</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dummyStudents.map((st) => (
              <tr key={st.admissionNo} className="hover:bg-slate-50/60 transition">
                <td className="px-5 py-3.5 font-mono text-xs">
                  <span className="font-semibold text-slate-900">{st.admissionNo}</span>
                  <span className="block text-slate-400">রোল: {st.roll}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="font-bold text-slate-900">{st.nameBn}</div>
                  <div className="text-xs text-slate-500">{st.nameEn}</div>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                  {st.marhala}
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                  {st.guardianPhone}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {st.isResidential ? (
                      <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                        <Home className="h-3 w-3 mr-1 text-emerald-600" />
                        আবাসিক
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        অনাবাসিক
                      </span>
                    )}

                    {st.isLillah && (
                      <span className="inline-flex items-center rounded bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-800 border border-purple-200">
                        <HeartHandshake className="h-3 w-3 mr-1 text-purple-600" />
                        লিল্লাহ বোর্ডিং
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right text-xs">
                  <button className="text-emerald-700 hover:text-emerald-900 font-medium">
                    প্রোফাইল দেখুন
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

