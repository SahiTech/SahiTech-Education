'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export interface SingleAttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remark?: string;
}

function isValidAttendanceDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

async function getCurrentAcademicYear(supabase: Awaited<ReturnType<typeof createClient>>, tenantId: string) {
  const { data, error } = await supabase
    .from('academic_years')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('is_current', true)
    .maybeSingle();
  if (error) throw new Error('চলতি শিক্ষাবর্ষ যাচাই করা যায়নি।');
  return data;
}

export async function loadSectionAttendance(params: {
  sectionId: string;
  attendanceDate: string;
}) {
  try {
    const context = await requirePermission('record_attendance');
    if (!params.sectionId || !isValidAttendanceDate(params.attendanceDate)) {
      return { success: false, error: 'সেকশন ও সঠিক তারিখ নির্বাচন করুন।', records: [] };
    }

    const supabase = await createClient();
    const currentYear = await getCurrentAcademicYear(supabase, context.tenantId);
    if (!currentYear) return { success: false, error: 'চলতি শিক্ষাবর্ষ সক্রিয় নেই।', records: [] };

    const { data: section } = await supabase
      .from('sections')
      .select('id')
      .eq('id', params.sectionId)
      .eq('tenant_id', context.tenantId)
      .maybeSingle();
    if (!section) return { success: false, error: 'নির্বাচিত সেকশনটি পাওয়া যায়নি।', records: [] };

    const { data, error } = await supabase
      .from('attendance_records')
      .select('student_id, status, remark')
      .eq('tenant_id', context.tenantId)
      .eq('academic_year_id', currentYear.id)
      .eq('section_id', params.sectionId)
      .eq('attendance_date', params.attendanceDate);

    if (error) return { success: false, error: 'হাজিরার তথ্য লোড করা যায়নি।', records: [] };
    return { success: true, records: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message || 'হাজিরার তথ্য লোড করা যায়নি।', records: [] };
  }
}

export async function recordBatchAttendance(params: {
  records: SingleAttendanceRecord[];
  sectionId: string;
  attendanceDate: string;
}) {
  try {
    const context = await requirePermission('record_attendance');
    const supabase = await createClient();

    if (!params.sectionId || !isValidAttendanceDate(params.attendanceDate)) {
      return { success: false, error: 'সেকশন ও সঠিক তারিখ নির্বাচন করুন।' };
    }
    if (!Array.isArray(params.records) || params.records.length === 0 || params.records.length > 300) {
      return { success: false, error: 'হাজিরার তালিকায় ১ থেকে ৩০০ জন শিক্ষার্থী থাকতে হবে।' };
    }

    const allowedStatuses = new Set(['present', 'absent', 'late', 'excused']);
    const studentIds = [...new Set(params.records.map((record) => record.studentId))];
    if (studentIds.length !== params.records.length || params.records.some((record) => !record.studentId || !allowedStatuses.has(record.status))) {
      return { success: false, error: 'হাজিরার তথ্য সঠিক নয়। তালিকাটি রিফ্রেশ করে আবার চেষ্টা করুন।' };
    }

    const currentYear = await getCurrentAcademicYear(supabase, context.tenantId);
    if (!currentYear) return { success: false, error: 'চলতি শিক্ষাবর্ষ সক্রিয় পাওয়া যায়নি।' };

    // Never trust the section/student IDs sent by the browser. Every student
    // must have an active enrollment in this exact section and academic year.
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('tenant_id', context.tenantId)
      .eq('academic_year_id', currentYear.id)
      .eq('section_id', params.sectionId)
      .eq('is_active', true)
      .in('student_id', studentIds);

    if (enrollmentError || (enrollments || []).length !== studentIds.length) {
      return { success: false, error: 'শিক্ষার্থী তালিকা ও নির্বাচিত সেকশনের মিল পাওয়া যায়নি। পৃষ্ঠা রিফ্রেশ করুন।' };
    }

    const payload = params.records.map((record) => ({
      tenant_id: context.tenantId,
      academic_year_id: currentYear.id,
      student_id: record.studentId,
      section_id: params.sectionId,
      attendance_date: params.attendanceDate,
      status: record.status,
      remark: record.remark?.trim() || null,
    }));

    const { error } = await supabase
      .from('attendance_records')
      .upsert(payload, { onConflict: 'tenant_id,student_id,attendance_date' });

    if (error) {
      return { success: false, error: `হাজিরা সংরক্ষণ ব্যর্থ: ${error.message}` };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'attendance.recorded',
      entityName: 'attendance_records',
      entityId: params.sectionId,
      newState: { date: params.attendanceDate, count: params.records.length },
    });

    revalidatePath('/dashboard/attendance');
    revalidatePath('/portals/faculty');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}
