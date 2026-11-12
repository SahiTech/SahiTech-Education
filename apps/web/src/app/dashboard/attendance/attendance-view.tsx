'use client';

import React, { useState } from 'react';
import { recordBatchAttendance, SingleAttendanceRecord } from '@/app/actions/attendance';
import { CalendarCheck, CheckCircle2, AlertCircle, X, Users, UserCheck, UserX, Clock, Calendar } from 'lucide-react';

interface AttendanceViewProps {
  students: Array<{ id: string; full_name_bn: string; admission_no: string }>;
  sections: Array<{ id: string; name_bn: string; classes: { name_bn: string } | null }>;
  initialRecords: Array<any>;
}

export function AttendanceView({ students, sections, initialRecords }: AttendanceViewProps) {
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
      setStatusMessage({ type: 'error', text: 'অনুগ্রহ করে শাখা বা জামাত নির্বাচন করুন।' });
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
      setStatusMessage({ type: 'success', text: `তারিখ: ${selectedDate} এর জন্য হাজিরা সফলভাবে সংরক্ষিত হয়েছে!` });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'হাজিরা সংরক্ষণে ত্রুটি।' });
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
          className={`rounded-lg p-4 text-xs font-medium flex items-center justify-between ${
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
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">হাজিরার তারিখ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">শাখা / সেকশন</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-600 focus:outline-none"
            >
              {sections.length === 0 ? (
                <option value="">কোনো শাখা প্রস্তুত নেই</option>
              ) : (
                sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.classes?.name_bn || 'জামাত'} - {sec.name_bn}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markAll('present')}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
          >
            সবাই উপস্থিত
          </button>
          <button
            type="button"
            onClick={() => markAll('absent')}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-100 transition"
          >
            সবাই অনুপস্থিত
          </button>
          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={loading}
            className="rounded-lg bg-emerald-700 px-5 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
          >
            {loading ? 'সংরক্ষণ হচ্ছে...' : 'হাজিরা নিশ্চিত করুন'}
          </button>
        </div>
      </div>

      {/* Real-time Tally Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <span className="text-[11px] text-slate-400 block font-bold">মোট তালিবুল ইলম</span>
          <span className="text-xl font-bold font-mono text-slate-900 mt-1">{total}</span>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center shadow-sm">
          <span className="text-[11px] text-emerald-700 block font-bold">উপস্থিত</span>
          <span className="text-xl font-bold font-mono text-emerald-800 mt-1">{presentCount}</span>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-center shadow-sm">
          <span className="text-[11px] text-red-700 block font-bold">অনুপস্থিত</span>
          <span className="text-xl font-bold font-mono text-red-800 mt-1">{absentCount}</span>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center shadow-sm">
          <span className="text-[11px] text-amber-700 block font-bold">দেরিতে আগমন / ছুটি</span>
          <span className="text-xl font-bold font-mono text-amber-800 mt-1">{lateCount + excusedCount}</span>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-center shadow-sm">
          <span className="text-[11px] text-blue-700 block font-bold">উপস্থিতির হার</span>
          <span className="text-xl font-bold font-mono text-blue-800 mt-1">{percentage}%</span>
        </div>
      </div>

      {/* Attendance Matrix Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-700" />
            দৈনিক হাজিরা তালিকা (Attendance Sheet)
          </h2>
          <span className="text-xs text-slate-500 font-mono">তারিখ: {selectedDate}</span>
        </div>

        {students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            এই শাখায় কোনো শিক্ষার্থী অন্তর্ভুক্ত নেই।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">দাখেলা নং</th>
                  <th className="px-5 py-3">তালিবুল ইলমের নাম</th>
                  <th className="px-5 py-3 text-center">উপস্থিতি স্থিতি</th>
                  <th className="px-5 py-3">মন্তব্য (ঐচ্ছিক)</th>
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
                            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            উপস্থিত
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(st.id, 'absent')}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                              currentStatus === 'absent'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            অনুপস্থিত
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(st.id, 'late')}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                              currentStatus === 'late'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            দেরি
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStudentStatus(st.id, 'excused')}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition ${
                              currentStatus === 'excused'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            ছুটি
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          placeholder="মন্তব্য লিখুন..."
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
        )}
      </div>
    </div>
  );
}

