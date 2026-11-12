import React from 'react';
import { getActiveTenantContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { Building2, Bed, Users, Plus, CheckCircle, Home, Phone } from 'lucide-react';
import { HostelRoomModal } from './hostel-modal';
import { getServerDictionary, getServerLocale, getServerDirection } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function HostelPage() {
  const dict = await getServerDictionary();
  const locale = await getServerLocale();
  const direction = await getServerDirection();
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
              {dict.hostel.title}
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              {dict.dashboard.residential}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {context.tenantName} · {dict.hostel.subtitle}
          </p>
        </div>

        <HostelRoomModal rooms={rooms} students={students} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{dict.hostel.buildingsAndRooms}</span>
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{rooms.length}</div>
          <div className="text-xs text-slate-400 mt-1">{dict.common.active}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{dict.hostel.allocatedBeds}</span>
            <Bed className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {occupiedBeds} / {totalBeds}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {totalBeds > 0 ? `${Math.round((occupiedBeds / totalBeds) * 100)}%` : '0%'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{dict.hostel.vacantBeds}</span>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{vacantBeds}</div>
          <div className="text-xs text-slate-400 mt-1">{dict.common.active}</div>
        </div>
      </div>

          {/* Allocations Roster */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-700" />
                <span>{dict.hostel.allocatedBeds}</span>
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {dict.common.total}: {allocations.length}
              </span>
            </div>

                {allocations.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    {dict.students.noStudentsDesc}
                  </div>
                          ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left rtl:text-right text-sm">
                              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3">{dict.hostel.roomNumber}</th>
                                  <th className="px-4 py-3">{dict.hostel.bedNumber}</th>
                                  <th className="px-4 py-3">{dict.common.name}</th>
                                  <th className="px-4 py-3">{dict.students.guardianPhone}</th>
                                  <th className="px-4 py-3 text-right rtl:text-left">{dict.common.date}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {allocations.map((a: any) => (
                                  <tr key={a.id} className="hover:bg-slate-50/60 transition">
                                    <td className="px-4 py-3.5 font-bold text-slate-900 text-xs">
                                      {a.rooms?.building_name ? `${a.rooms.building_name} · ` : ''}{dict.hostel.roomNumber} {a.rooms?.room_number}
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                                      {a.bed_number}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs">
                                      <div className="font-bold text-slate-900">{a.students?.full_name_bn}</div>
                                      <div className="font-mono text-[10px] text-slate-400">{a.students?.admission_no}</div>
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                                      {a.students?.guardian_phone || '—'}
                                    </td>
                                    <td className="px-4 py-3.5 text-right rtl:text-left font-mono text-xs text-slate-500">
                                      {new Date(a.allocation_start).toLocaleDateString(locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'bn-BD')}
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
