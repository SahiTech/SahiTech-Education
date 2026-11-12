'use client';

import React, { useState } from 'react';
import { createHostelRoom, allocateHostelBed } from '@/app/actions/hostel';
import { Plus, Bed, Building2, X, Loader2 } from 'lucide-react';

interface HostelModalProps {
  rooms: any[];
  students: any[];
}

export function HostelRoomModal({ rooms, students }: HostelModalProps) {
  const [modalType, setModalType] = useState<'none' | 'create_room' | 'allocate_bed'>('none');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Room Form State
  const [buildingName, setBuildingName] = useState('দারুল উলুম মূল ভবন');
  const [floorNumber, setFloorNumber] = useState('২য়');
  const [roomNumber, setRoomNumber] = useState('');
  const [totalBeds, setTotalBeds] = useState(6);

  // Bed Allocation State
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [bedNumber, setBedNumber] = useState('BED-1');

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const res = await createHostelRoom({
      buildingName,
      floorNumber,
      roomNumber,
      totalBeds: Number(totalBeds),
    });

    setIsPending(false);
    if (res.success) {
      setModalType('none');
      setRoomNumber('');
    } else {
      setError(res.error || 'কক্ষ তৈরি ব্যর্থ হয়েছে।');
    }
  };

  const handleAllocateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const res = await allocateHostelBed({
      studentId: selectedStudentId,
      roomId: selectedRoomId,
      bedNumber,
    });

    setIsPending(false);
    if (res.success) {
      setModalType('none');
    } else {
      setError(res.error || 'সিট বরাদ্দ ব্যর্থ হয়েছে।');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setModalType('create_room')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <Building2 className="h-3.5 w-3.5" />
          + নতুন কক্ষ
        </button>
        <button
          onClick={() => setModalType('allocate_bed')}
          disabled={rooms.length === 0 || students.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 transition"
        >
          <Bed className="h-3.5 w-3.5" />
          + সিট বরাদ্দ
        </button>
      </div>

      {modalType !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {modalType === 'create_room' ? 'নতুন ছাত্রাবাস কক্ষ তৈরি' : 'ছাত্রকে সিট/বেড বরাদ্দকরণ'}
              </h3>
              <button onClick={() => setModalType('none')} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            {modalType === 'create_room' && (
              <form onSubmit={handleCreateRoom} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ভবনের নাম *</label>
                  <input
                    type="text"
                    required
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">তলা / ফ্লোর</label>
                    <input
                      type="text"
                      value={floorNumber}
                      onChange={(e) => setFloorNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">কক্ষ নম্বর *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ২০৪"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">সিট সংখ্যা (Beds Capacity)</label>
                  <input
                    type="number"
                    value={totalBeds}
                    onChange={(e) => setTotalBeds(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalType('none')}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-emerald-700 text-white px-4 py-1.5 font-bold hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isPending ? 'সংরক্ষণ...' : 'কক্ষ তৈরি করুন'}
                  </button>
                </div>
              </form>
            )}

            {modalType === 'allocate_bed' && (
              <form onSubmit={handleAllocateBed} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">শিক্ষার্থী নির্বাচন করুন *</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.full_name_bn} ({st.admission_no})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">কক্ষ নির্বাচন *</label>
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          কক্ষ {r.room_number} ({r.building_name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">বেড / সিট কোড *</label>
                    <input
                      type="text"
                      required
                      value={bedNumber}
                      onChange={(e) => setBedNumber(e.target.value)}
                      placeholder="BED-1"
                      className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setModalType('none')}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-emerald-700 text-white px-4 py-1.5 font-bold hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isPending ? 'বরাদ্দ...' : 'সিট নিশ্চিত করুন'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
