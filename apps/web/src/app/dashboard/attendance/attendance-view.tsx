'use client';

import React, { useState } from 'react';
import { recordBatchAttendance, SingleAttendanceRecord } from '@/app/actions/attendance';
import { CalendarCheck, CheckCircle2, AlertCircle, X, Users, UserCheck, UserX, Clock, Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface AttendanceViewProps {
  students: Array<{ id: string; full_name_bn: string; admission_no: string }>;
  sections: Array<{ id: string; name_bn: string; classes: { name_bn: string } | null }>;
  initialRecords: Array<any>;
}

export function AttendanceView({ students, sections, initialRecords }: AttendanceViewProps) {
  const { t, locale, direction } = useI18n();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize attendance state mapping
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: 'present' | 'absent' | 'late' | 'excused'; remark: string }>>(() => {
    const map: Record<string, { status: 'present' | 'absent' | 'late' | 'excused'; remark: string }> = {};
    for (const rec of initialRecords) {
      map[rec.student_id] = { status: rec.status, remark: rec.remark || '' };
    }
    for (const st of students) {
      if (!map[st.id]) {
        map[st.id] = { status: 'present', remark: '' };
      }
    }
    return map;
  });

  const updateStudentStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const markAll = (status: 'present' | 'absent') => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      for (const st of students) {
        next[st.id] = { ...next[st.id], status };
      }
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedSectionId) {
      setStatusMessage({ type: 'error', text: t.attendance.classSection });
      return;
    }
    setLoading(true);
    setStatusMessage(null);

    const records: SingleAttendanceRecord[] = students.map((st) => ({
      studentId: st.id,
      status: attendanceMap[st.id]?.status || 'present',
      remark: attendanceMap[st.id]?.remark,
    }));

    const res = await recordBatchAttendance({
      records,
      sectionId: selectedSectionId,
      attendanceDate: selectedDate,
    });

    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `${t.common.success}: ${selectedDate}` });
    } else {
      setStatusMessage({ type: 'error', text: res.error || t.common.error });
    }
  };

  // Metrics
  const total = students.length;
  const presentCount = students.filter((s) => (attendanceMap[s.id]?.status || 'present') === 'present').length;
  const absentCount = students.filter((s) => attendanceMap[s.id]?.status === 'absent').length;
  const lateCount = students.filter((s) => attendanceMap[s.id]?.status === 'late').length;
  const excusedCount = students.filter((s) => attendanceMap[s.id]?.status === 'excused').length;
  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`rounded-xl p-4 text-xs font-medium flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Date & Section Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {t.attendance.attendanceDate}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none min-h-[42px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              {t.attendance.classSection}
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none min-h-[42px]"
            >
              {sections.length === 0 ? (
                <option value="">{t.common.select}</option>
              ) : (
                sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.classes?.name_bn || 'Class'} - {sec.name_bn}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => markAll('present')}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition min-h-[42px]"
          >
            {t.attendance.markAllPresent}
          </button>
          <button
            type="button"
            onClick={() => markAll('absent')}
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-800 hover:bg-red-100 transition min-h-[42px]"
          >
            {t.attendance.markAllAbsent}
          </button>
          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={loading}
            className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition min-h-[42px]"
          >
            {loading ? t.students.saving : t.attendance.saveAttendance}
          </button>
        </div>
      </div>

      {/* Real-time Tally Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <span className="text-[11px] text-slate-400 block font-bold">{t.common.total}</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1">{total}</span>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center shadow-sm">
          <span className="text-[11px] text-emerald-700 block font-bold">{t.attendance.present}</span>
          <span className="text-xl font-bold font-mono text-emerald-800 mt-1">{presentCount}</span>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-center shadow-sm">
          <span className="text-[11px] text-red-700 block font-bold">{t.attendance.absent}</span>
          <span className="text-xl font-bold font-mono text-red-800 mt-1">{absentCount}</span>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center shadow-sm">
          <span className="text-[11px] text-amber-700 block font-bold">{t.attendance.late} / {t.attendance.excused}</span>
          <span className="text-xl font-bold font-mono text-amber-800 mt-1">{lateCount + excusedCount}</span>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-center shadow-sm">
          <span className="text-[11px] text-blue-700 block font-bold">{t.attendance.percentage}</span>
          <span className="text-xl font-bold font-mono text-blue-800 mt-1">{percentage}%</span>
        </div>
      </div>

      {/* Attendance Matrix / Mobile Card List */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-700" />
            <span>{t.attendance.sheetTitle}</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">{selectedDate}</span>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            {t.students.noStudentsDesc}
          </div>
        ) : (
  <>
    {/* Mobile Touch-Optimized Cards (< 640px) */}
    <div className="divide-y divide-slate-100 block sm:hidden">
      {students.map((st) => {
        const currentStatus = attendanceMap[st.id]?.status || 'present';
        return (
          <div key={st.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-sm text-slate-900">{st.full_name_bn}</div>
                <div className="font-mono text-xs text-slate-400 mt-0.5">{st.admission_no}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => updateStudentStatus(st.id, 'present')}
                className={`rounded-lg py-2.5 text-xs font-bold transition min-h-[44px] flex items-center justify-center ${currentStatus === 'present'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {t.attendance.present}
              </button>
              <button
                type="button"
                onClick={() => updateStudentStatus(st.id, 'absent')}
                className={`rounded-lg py-2.5 text-xs font-bold transition min-h-[44px] flex items-center justify-center ${currentStatus === 'absent'
                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {t.attendance.absent}
              </button>
              <button
                type="button"
                onClick={() => updateStudentStatus(st.id, 'late')}
                className={`rounded-lg py-2.5 text-xs font-bold transition min-h-[44px] flex items-center justify-center ${currentStatus === 'late'
                    ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {t.attendance.late}
              </button>
              <button
                type="button"
                onClick={() => updateStudentStatus(st.id, 'excused')}
                className={`rounded-lg py-2.5 text-xs font-bold transition min-h-[44px] flex items-center justify-center ${currentStatus === 'excused'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {t.attendance.excused}
              </button>
            </div>

            <input
              type="text"
              placeholder={t.common.notes}
              value={attendanceMap[st.id]?.remark || ''}
              onChange={(e) =>
                setAttendanceMap((prev) => ({
                  ...prev,
                  [st.id]: { ...prev[st.id], remark: e.target.value },
                }))
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 w-full focus:border-emerald-600 focus:outline-none min-h-[38px]"
            />
          </div>
        );
      })}
    </div>

    {/* Desktop Table View (>= 640px) */}
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full text-left rtl:text-right text-xs">
        <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
          <tr>
            <th className="px-5 py-3">{t.students.admissionNo}</th>
            <th className="px-5 py-3">{t.common.name}</th>
            <th className="px-5 py-3 text-center">{t.common.status}</th>
            <th className="px-5 py-3">{t.common.notes}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {students.map((st) => {
            const currentStatus = attendanceMap[st.id]?.status || 'present';
            return (
              <tr key={st.id} className="hover:bg-slate-50/60 transition">
                <td className="px-5 py-3 font-mono font-bold text-slate-900">{st.admission_no}</td>
                <td className="px-5 py-3 font-semibold text-slate-800">{st.full_name_bn}</td>
                <td className="px-5 py-3 text-center">
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    <button
                      type="button"
                      onClick={() => updateStudentStatus(st.id, 'present')}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition min-h-[34px] ${currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {t.attendance.present}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStudentStatus(st.id, 'absent')}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition min-h-[34px] ${currentStatus === 'absent'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {t.attendance.absent}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStudentStatus(st.id, 'late')}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition min-h-[34px] ${currentStatus === 'late'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {t.attendance.late}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStudentStatus(st.id, 'excused')}
                      className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition min-h-[34px] ${currentStatus === 'excused'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {t.attendance.excused}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <input
                    type="text"
                    placeholder={t.common.notes}
                    value={attendanceMap[st.id]?.remark || ''}
                    onChange={(e) =>
                      setAttendanceMap((prev) => ({
                        ...prev,
                        [st.id]: { ...prev[st.id], remark: e.target.value },
                      }))
                    }
                    className="rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-700 w-full max-w-xs focus:border-emerald-600 focus:outline-none"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </>
        )}
      </div >
    </div >
  );
}
