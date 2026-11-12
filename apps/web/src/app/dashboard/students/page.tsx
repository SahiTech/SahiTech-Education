import React from 'react';
import Link from 'next/link';
import { Users, Search, Filter, Plus, Home, HeartHandshake, Phone, ArrowRight } from 'lucide-react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

interface StudentsDirectoryProps {
  searchParams: Promise<{
    search?: string;
    residential?: string;
  }>;
}

export default async function StudentsDirectoryPage({ searchParams }: StudentsDirectoryProps) {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();
  const context = await getActiveTenantContext();

  if (!context) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
        {dict.admissions.subtitle}
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

  const { data: students } = await query;
  const studentList = students || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {dict.students.directoryTitle}
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-700">
              {dict.students.totalCount}: {studentList.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · {dict.students.directorySubtitle}
          </p>
        </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/admissions"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition min-h-[40px]"
            >
              {dict.students.applications}
            </Link>
            <Link
              href="/dashboard/students/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition min-h-[40px]"
            >
              <Plus className="h-4 w-4" />
              <span>{dict.students.newAdmission}</span>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <form method="GET" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={search || ''}
              placeholder={dict.students.searchPlaceholder}
              className="w-full rounded-lg border border-slate-300 bg-white pl-9 rtl:pl-4 rtl:pr-9 pr-4 py-2 text-sm focus:border-emerald-600 focus:outline-none min-h-[42px]"
            />
          </div>

          <select
            name="residential"
            defaultValue={residential || ''}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-emerald-600 focus:outline-none min-h-[42px]"
          >
            <option value="">{dict.students.allResidentialStatus}</option>
            <option value="yes">{dict.students.onlyResidential}</option>
            <option value="no">{dict.students.onlyNonResidential}</option>
          </select>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 min-h-[42px]"
          >
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            <span>{dict.students.filterBtn}</span>
          </button>
        </form>

        {/* Content: Empty State, Mobile Cards, or Desktop Table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {studentList.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">{dict.students.noStudentsFound}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {dict.students.noStudentsDesc}
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard/students/new"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition min-h-[40px]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{dict.students.newAdmission}</span>
                </Link>
              </div>
            </div>
          ) : (
                          <>
                            {/* Mobile Card View (< 640px) */}
                            <div className="divide-y divide-slate-100 block sm:hidden">
                              {studentList.map((st) => (
                <div key={st.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">
                        {locale === 'en' ? st.full_name_en || st.full_name_bn : st.full_name_bn}
                      </div>
                      {st.full_name_en && locale !== 'en' && (
                        <div className="text-xs text-slate-400">{st.full_name_en}</div>
                      )}
                      <div className="font-mono text-xs text-slate-500 mt-0.5">
                        {st.admission_no}
                      </div>
                    </div>

                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(st.admission_date || st.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'bn-BD')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{st.guardian_phone}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                    {st.is_residential ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                        <Home className="h-3 w-3" />
                        <span>{dict.students.residential}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {dict.students.nonResidential}
                      </span>
                    )}

                    {st.is_lillah_boarder && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 border border-purple-200">
                        <HeartHandshake className="h-3 w-3 text-purple-600" />
                        <span>{dict.students.lillahRecipient}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
                          </div>

                          {/* Desktop Table View (>= 640px) */}
                          <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left rtl:text-right text-sm">
                              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                  <th className="px-5 py-3">{dict.students.admissionNo}</th>
                                  <th className="px-5 py-3">{dict.common.name}</th>
                                  <th className="px-5 py-3">{dict.students.guardianPhone}</th>
                                  <th className="px-5 py-3">{dict.students.residentialStatus}</th>
                                  <th className="px-5 py-3">{dict.students.lillahBoarding}</th>
                                  <th className="px-5 py-3 text-right rtl:text-left">{dict.students.admissionDate}</th>
                                </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {studentList.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50/60 transition">
                              <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900">
                                {st.admission_no}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-slate-900">
                                  {locale === 'en' ? st.full_name_en || st.full_name_bn : st.full_name_bn}
                                </div>
                                {st.full_name_en && locale !== 'en' && (
                                  <div className="text-xs text-slate-500">{st.full_name_en}</div>
                                )}
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
                                    <span>{dict.students.residential}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                    <span>{dict.students.nonResidential}</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-xs">
                                {st.is_lillah_boarder ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 border border-purple-200/60">
                                    <HeartHandshake className="h-3 w-3 text-purple-600" />
                                    <span>{dict.students.lillahRecipient}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">
                                    {dict.students.generalStudent}
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right rtl:text-left font-mono text-xs text-slate-500">
                                {new Date(st.admission_date || st.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'bn-BD')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
          </>
        )}
            </div>
    </div>
        );
}
