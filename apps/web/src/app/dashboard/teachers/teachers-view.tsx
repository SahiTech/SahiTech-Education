'use client';

import React, { useState } from 'react';
import { addTeacher, submitStaffLeave, updateLeaveStatus } from '@/app/actions/teachers';
import { Plus, GraduationCap, Phone, Mail, Calendar, CheckCircle2, AlertCircle, X, Clock, Check, Ban } from 'lucide-react';

interface TeachersViewProps {
  teachers: Array<any>;
  leaves: Array<any>;
}

export function TeachersView({ teachers, leaves }: TeachersViewProps) {
  const [activeTab, setActiveTab] = useState<'roster' | 'leaves'>('roster');
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Teacher form states
  const [fullNameBn, setFullNameBn] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [designation, setDesignation] = useState('উস্তাদ / শিক্ষক');
  const [qualification, setQualification] = useState('দাওরায়ে হাদীস (মাস্টার্স সমমান)');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Leave form states
  const [leaveTeacherId, setLeaveTeacherId] = useState('');
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const res = await addTeacher({
      fullNameBn,
      fullNameEn,
      designation,
      qualification,
      phone,
      email: email || undefined,
    });

    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'উস্তাদ সফলভাবে নিবন্ধিত হয়েছেন!' });
      setShowAddTeacherModal(false);
      setFullNameBn('');
      setFullNameEn('');
      setPhone('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'নিবন্ধন ব্যর্থ হয়েছে।' });
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    const res = await submitStaffLeave({
      teacherId: leaveTeacherId,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    setLoading(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'ছুটির আবেদন গৃহিত হয়েছে এবং অনুমোদনের অপেক্ষায় আছে।' });
      setShowLeaveModal(false);
      setReason('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'আবেদন জমাদান ব্যর্থ।' });
    }
  };

  const handleLeaveDecision = async (leaveId: string, decision: 'approved' | 'rejected') => {
    setLoading(true);
    const res = await updateLeaveStatus(leaveId, decision);
    setLoading(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: decision === 'approved' ? 'ছুটি অনুমোদিত হয়েছে।' : 'ছুটি প্রত্যাখ্যান করা হয়েছে।',
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'সিদ্ধান্ত বাস্তবায়নে ব্যর্থ।' });
    }
  };

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

      {/* Tabs and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex gap-2 border-b sm:border-b-0 border-slate-200 pb-2 sm:pb-0">
          <button
            onClick={() => setActiveTab('roster')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'roster'
                ? 'bg-emerald-800 text-white shadow'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            আসতিযায়ে কিরাম তালিকা ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'leaves'
                ? 'bg-emerald-800 text-white shadow'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            ছুটির আবেদন ও অনুমোদন
            {leaves.filter((l) => l.status === 'pending').length > 0 && (
              <span className="rounded-full bg-amber-500 text-white text-[10px] px-1.5 py-0.2">
                {leaves.filter((l) => l.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowLeaveModal(true)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            ছুটির আবেদন দাখিল
          </button>
          <button
            onClick={() => setShowAddTeacherModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition"
          >
            <Plus className="h-4 w-4" />
            নতুন উস্তাদ যোগ করুন
          </button>
        </div>
      </div>

      {/* TAB 1: TEACHERS ROSTER */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.length === 0 ? (
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
              <GraduationCap className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              এখনো কোনো শিক্ষক বা স্টাফের তথ্য এন্ট্রি করা হয়নি। উপরের বোতাম চেপে শিক্ষক অন্তর্ভুক্ত করুন।
            </div>
          ) : (
            teachers.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 hover:border-emerald-300 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{t.full_name_bn}</h3>
                    <span className="text-xs text-slate-500 block">{t.full_name_en}</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    {t.designation || 'উস্তাদ'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700">যোগ্যতা:</span> {t.qualification || 'দাওরায়ে হাদীস'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-mono text-[11px]">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                  {t.email && (
                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span>{t.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-50">
                  <span>আইডি: {t.employee_id}</span>
                  <span>যোগদান: {new Date(t.joining_date || t.created_at).toLocaleDateString('bn-BD')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: STAFF LEAVES */}
      {activeTab === 'leaves' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-700" />
              ছুটির আবেদন ও নিষ্পত্তি রেকর্ড
            </h2>
            <span className="text-xs text-slate-500 font-mono">মোট আবেদন: {leaves.length}টি</span>
          </div>

          {leaves.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              কোনো ছুটির আবেদন পাওয়া যায়নি।
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <div key={l.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{l.teachers?.full_name_bn}</span>
                      <span className="text-xs text-slate-500">({l.teachers?.designation || 'উস্তাদ'})</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          l.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {l.status === 'approved' ? 'অনুমোদিত' : l.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'বিবেচনাধীন'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      কারণ: <span className="font-medium text-slate-800">{l.reason || 'জরুরি প্রয়োজন'}</span>
                    </p>

                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-4">
                      <span>ধরন: <span className="uppercase font-bold text-slate-700">{l.leave_type}</span></span>
                      <span>মেয়াদ: {l.start_date} হতে {l.end_date} ({l.days_count} দিন)</span>
                    </div>
                  </div>

                  {l.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLeaveDecision(l.id, 'approved')}
                        disabled={loading}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-800 transition disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" />
                        অনুমোদন
                      </button>
                      <button
                        onClick={() => handleLeaveDecision(l.id, 'rejected')}
                        disabled={loading}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition disabled:opacity-50"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        প্রত্যাখ্যান
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">নতুন উস্তাদ / স্টাফ অন্তর্ভুক্তি</h3>
              <button onClick={() => setShowAddTeacherModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">পূর্ণ নাম (বাংলায়) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মাওলানা মুহাম্মাদ আব্দুল্লাহ"
                  value={fullNameBn}
                  onChange={(e) => setFullNameBn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">পূর্ণ নাম (ইংরেজিতে) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mawlana Muhammad Abdullah"
                  value={fullNameEn}
                  onChange={(e) => setFullNameEn(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পদবী বা দায়িত্ব *</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">শিক্ষাগত যোগ্যতা *</label>
                  <input
                    type="text"
                    required
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ইমেইল (ঐচ্ছিক)</label>
                  <input
                    type="email"
                    placeholder="teacher@madrasa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {loading ? 'নিবন্ধন হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">ছুটির আবেদন দাখিল</h3>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">উস্তাদ নির্বাচন *</label>
                <select
                  required
                  value={leaveTeacherId}
                  onChange={(e) => setLeaveTeacherId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">-- আবেদনকারী উস্তাদ বেছে নিন --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name_bn} ({t.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ছুটির ধরন</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                >
                  <option value="casual">নৈমিত্তিক ছুটি (Casual Leave)</option>
                  <option value="medical">চিকিৎসাজনিত ছুটি (Medical Leave)</option>
                  <option value="hajj">হজ্জ / ওমরাহ ছুটি</option>
                  <option value="ramadan">রমাদান বিশেষ ছুটি</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">সমাপ্তির তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ছুটির সুনির্দিষ্ট কারণ *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="যেমন: পারিবাররিক জরুরি অনুষ্ঠান বা অসুস্থতা..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {loading ? 'আবেদন জমাদান হচ্ছে...' : 'আবেদন জমা দিন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
