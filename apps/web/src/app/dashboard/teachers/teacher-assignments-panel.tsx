'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { assignTeacherToSection, linkTeacherAccount, removeTeacherAssignment } from '@/app/actions/teachers';

type Teacher = { id: string; full_name_bn: string; full_name_en: string; email: string | null; user_id: string | null; is_active: boolean };
type ClassOption = { id: string; name_bn: string; name_en: string };
type SectionOption = { id: string; class_id: string; name: string };
type SubjectOption = { id: string; class_id: string; name_bn: string; name_en: string };
type Assignment = { id: string; teacher_id: string; class_id: string; section_id: string; subject_id: string | null };

export function TeacherAssignmentsPanel({
  teachers, classes, sections, subjects, assignments, academicYearId,
}: {
  teachers: Teacher[];
  classes: ClassOption[];
  sections: SectionOption[];
  subjects: SubjectOption[];
  assignments: Assignment[];
  academicYearId: string | null;
}) {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState('');
  const [linkTeacherId, setLinkTeacherId] = useState('');
  const [linkEmail, setLinkEmail] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const linkedTeachers = teachers.filter((teacher) => teacher.is_active && !!teacher.user_id);
  const unlinkedTeachers = teachers.filter((teacher) => teacher.is_active && !teacher.user_id && !!teacher.email);
  const availableSections = useMemo(() => sections.filter((section) => section.class_id === classId), [sections, classId]);
  const availableSubjects = useMemo(() => subjects.filter((subject) => subject.class_id === classId), [subjects, classId]);

  async function handleLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(null);
    const result = await linkTeacherAccount({ teacherId: linkTeacherId, email: linkEmail });
    setBusy(false);
    setMessage({ ok: result.success, text: result.success ? 'যাচাইকৃত Login Account শিক্ষকের সঙ্গে যুক্ত হয়েছে।' : (result.error || 'Account যুক্ত করা যায়নি।') });
    if (result.success) { setLinkTeacherId(''); setLinkEmail(''); router.refresh(); }
  }

  async function handleAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(null);
    const result = await assignTeacherToSection({ teacherId, classId, sectionId, subjectId: subjectId || undefined });
    setBusy(false);
    setMessage({ ok: result.success, text: result.success ? 'শিক্ষকের ক্লাস/সেকশন দায়িত্ব যুক্ত হয়েছে।' : (result.error || 'Assignment সংরক্ষণ হয়নি।') });
    if (result.success) { setSubjectId(''); router.refresh(); }
  }

  async function handleRemove(id: string) {
    setBusy(true); setMessage(null);
    const result = await removeTeacherAssignment(id);
    setBusy(false);
    setMessage({ ok: result.success, text: result.success ? 'Assignment বাতিল হয়েছে।' : (result.error || 'Assignment বাতিল হয়নি।') });
    if (result.success) router.refresh();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-bold text-slate-900">শিক্ষক Login ও Class Assignment</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">শিক্ষককে নির্দিষ্ট সেকশনে দায়িত্ব না দিলে তিনি শিক্ষার্থীর তথ্য বা হাজিরা দেখতে পারবেন না। Account link করতে শিক্ষকের রেকর্ডের ইমেইল এবং আগে থেকে তৈরি, email-verified MDI Login Account একই হতে হবে।</p>
      </div>

      {message && <p role="status" className={`rounded-lg border px-3 py-2 text-xs ${message.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{message.text}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={handleLink} className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800">১. Teacher Login Account Link</h3>
          {unlinkedTeachers.length === 0 ? (
            <p className="text-xs text-slate-500">ইমেইলসহ কোনো সক্রিয়, unlinked শিক্ষক নেই। আগে শিক্ষকের প্রোফাইলে ইমেইল যোগ করুন।</p>
          ) : (
            <>
              <label className="block text-xs font-medium text-slate-600">শিক্ষক</label>
              <select required value={linkTeacherId} onChange={(event) => { const id = event.target.value; setLinkTeacherId(id); setLinkEmail(unlinkedTeachers.find((item) => item.id === id)?.email || ''); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">শিক্ষক নির্বাচন করুন</option>
                {unlinkedTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name_bn || teacher.full_name_en} · {teacher.email}</option>)}
              </select>
              <label className="block text-xs font-medium text-slate-600">Verified Login Email</label>
              <input required type="email" value={linkEmail} onChange={(event) => setLinkEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="teacher@example.com" />
              <button disabled={busy || !linkTeacherId} className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'প্রক্রিয়াধীন…' : 'Account Link করুন'}</button>
            </>
          )}
        </form>

        <form onSubmit={handleAssign} className="space-y-3 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-bold text-slate-800">২. Class / Section Assignment</h3>
          {!academicYearId ? <p className="text-xs text-rose-700">চলতি শিক্ষাবর্ষ নির্ধারণ না করা পর্যন্ত Assignment দেওয়া যাবে না।</p> : linkedTeachers.length === 0 ? <p className="text-xs text-slate-500">প্রথমে একজন শিক্ষকের verified Login Account Link করুন।</p> : (
            <>
              <label className="block text-xs font-medium text-slate-600">শিক্ষক</label>
              <select required value={teacherId} onChange={(event) => setTeacherId(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">শিক্ষক নির্বাচন করুন</option>
                {linkedTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name_bn || teacher.full_name_en}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-medium text-slate-600">জামাত / Class</label><select required value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(''); setSubjectId(''); }} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"><option value="">Class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name_bn || item.name_en}</option>)}</select></div>
                <div><label className="block text-xs font-medium text-slate-600">Section</label><select required value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"><option value="">Section</option>{availableSections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-medium text-slate-600">বিষয় (ঐচ্ছিক)</label><select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">সব বিষয়</option>{availableSubjects.map((item) => <option key={item.id} value={item.id}>{item.name_bn || item.name_en}</option>)}</select></div>
              <button disabled={busy || !teacherId || !classId || !sectionId} className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? 'প্রক্রিয়াধীন…' : 'Assignment সংরক্ষণ করুন'}</button>
            </>
          )}
        </form>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-800">চলতি শিক্ষাবর্ষের সক্রিয় Assignment ({assignments.length})</h3>
        {assignments.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500">এখনো কোনো শিক্ষককে ক্লাস/সেকশনে Assign করা হয়নি।</p> : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {assignments.map((assignment) => {
              const teacher = teachers.find((item) => item.id === assignment.teacher_id);
              const classroom = classes.find((item) => item.id === assignment.class_id);
              const section = sections.find((item) => item.id === assignment.section_id);
              const subject = subjects.find((item) => item.id === assignment.subject_id);
              return <div key={assignment.id} className="flex items-center justify-between gap-3 px-3 py-3 text-xs">
                <div><p className="font-semibold text-slate-800">{teacher?.full_name_bn || teacher?.full_name_en || 'শিক্ষক'}</p><p className="mt-0.5 text-slate-500">{classroom?.name_bn || classroom?.name_en || 'Class'} · {section?.name || 'Section'} · {subject ? (subject.name_bn || subject.name_en) : 'সব বিষয়'}</p></div>
                <button type="button" disabled={busy} onClick={() => handleRemove(assignment.id)} className="shrink-0 rounded-md border border-rose-200 px-2.5 py-1.5 font-semibold text-rose-700 disabled:opacity-50">বাতিল</button>
              </div>;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
