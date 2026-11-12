import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { Building2, Bed, Users, Plus, CheckCircle, Home, Phone } from 'lucide-react';
import { HostelRoomModal } from './hostel-modal';

export const dynamic = 'force-dynamic';

export default async function HostelPage() {
  const context = await getActiveTenantContext();
  if (!context) return null;

  const supabase = await createClient();

  const [roomsRes, allocationsRes, studentsRes] = await Promise.all([
    supabase
      .from('hostel_rooms')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('room_number'),
    supabase
      .from('hostel_allocations')
      .select(`
        id,
        bed_number,
        allocation_start,
        is_active,
        rooms:room_id (building_name, room_number),
        students:student_id (id, full_name_bn, admission_no, guardian_phone)
      `)
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true),
    supabase
      .from('students')
      .select('id, full_name_bn, admission_no')
      .eq('tenant_id', context.tenantId)
      .eq('is_active', true),
  ]);

  const rooms = roomsRes.data || [];
  const allocations = allocationsRes.data || [];
  const students = studentsRes.data || [];

  const totalBeds = rooms.reduce((acc, r) => acc + (r.total_beds || 0), 0);
  const occupiedBeds = allocations.length;
  const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              দারুল ইক্বামাহ ও ছাত্রাবাস ব্যবস্থাপনা (Hostel & Boarding)
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              আবাসিক হল
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · ছাত্রাবাস কক্ষ, খাট/সিট বণ্টন ও তত্ত্বাবধান রেজিস্ট্রি।
          </p>
        </div>

        <HostelRoomModal rooms={rooms} students={students} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>মোট ছাত্রাবাস কক্ষ (Rooms)</span>
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{rooms.length} টি কক্ষ</div>
          <div className="text-xs text-slate-400 mt-1">সক্রিয় দারুল ইক্বামাহ ভবন</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>মোট সিট ও ধারণক্ষমতা (Capacity)</span>
            <Bed className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalBeds} টি সিট</div>
          <div className="text-xs text-slate-500 mt-1">বরাদ্দকৃত: {occupiedBeds} জন</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>খালি সিট (Vacant Beds)</span>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{vacantBeds} টি উপলব্ধ</div>
          <div className="text-xs text-slate-500 mt-1">নতুন ছাত্রদের জন্য প্রস্তুত</div>
        </div>
      </div>

      {/* Grid: Rooms & Current Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms List */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-700" />
            কক্ষ তালিকা (Hostel Rooms)
          </h3>

          {rooms.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">এখনো কোনো ছাত্রাবাস কক্ষ তৈরি করা হয়নি।</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {rooms.map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">কক্ষ নং {r.room_number}</span>
                    <span className="block text-slate-400">{r.building_name} · {r.floor_number} তলা</span>
                  </div>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                    {r.total_beds} সিট
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Allocations Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-700" />
              বর্তমান ছাত্রাবাস সিট বরাদ্দ (Active Allocations)
            </h3>
            <span className="text-xs font-mono text-slate-400">মোট: {allocations.length} জন</span>
          </div>

          {allocations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              এখনো কোনো ছাত্রকে সিট বরাদ্দ দেওয়া হয়নি।
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">শিক্ষার্থীর নাম</th>
                    <th className="px-4 py-3">কক্ষ ও ভবন</th>
                    <th className="px-4 py-3">বেড নং</th>
                    <th className="px-4 py-3">মোবাইল</th>
                    <th className="px-4 py-3 text-right">বরাদ্দ তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocations.map((a) => {
                    const st = a.students as any;
                    const rm = a.rooms as any;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-xs">
                          <span className="font-bold text-slate-900 block">{st?.full_name_bn}</span>
                          <span className="font-mono text-slate-400 text-[10px]">{st?.admission_no}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700">
                          {rm?.building_name} (কক্ষ {rm?.room_number})
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-700">
                          {a.bed_number}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {st?.guardian_phone || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">
                          {a.allocation_start}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
