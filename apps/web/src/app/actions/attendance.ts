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

export async function recordBatchAttendance(params: {
  records: SingleAttendanceRecord[];
  sectionId: string;
  attendanceDate: string;
}) {
  try {
    const context = await requirePermission('record_attendance');
    const supabase = await createClient();

    // Get current academic year
    const { data: curYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('tenant_id', context.tenantId)
      .eq('is_current', true)
      .maybeSingle();

    if (!curYear) {
      return { success: false, error: 'চলতি শিক্ষাবর্ষ সক্রিয় পাওয়া যায়নি।' };
    }

    const payload = params.records.map((r) => ({
      tenant_id: context.tenantId,
      academic_year_id: curYear.id,
      student_id: r.studentId,
      section_id: params.sectionId,
      attendance_date: params.attendanceDate,
      status: r.status,
      remark: r.remark || null,
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
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

