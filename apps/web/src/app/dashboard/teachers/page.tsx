import React from 'react';
import { requirePermission } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { TeachersView } from './teachers-view';
import { TeacherAssignmentsPanel } from './teacher-assignments-panel';
import { getServerDictionary } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function TeachersDirectoryPage() {
  const dict = await getServerDictionary();
  const context = await requirePermission('manage_tenant_settings');
  const supabase = await createClient();

  const [teachersRes, leavesRes, yearRes, classesRes, sectionsRes, subjectsRes] = await Promise.all([
    supabase.from('teachers').select('*').eq('tenant_id', context.tenantId).order('created_at', { ascending: false }),
    supabase.from('staff_leaves').select('id,leave_type,start_date,end_date,days_count,reason,status,created_at,teachers:teacher_id(full_name_bn,designation)').eq('tenant_id', context.tenantId).order('created_at', { ascending: false }),
    supabase.from('academic_years').select('id').eq('tenant_id', context.tenantId).eq('is_current', true).maybeSingle(),
    supabase.from('classes').select('id,name_bn,name_en').eq('tenant_id', context.tenantId).order('name_bn'),
    supabase.from('sections').select('id,class_id,name').eq('tenant_id', context.tenantId).order('name'),
    supabase.from('subjects').select('id,class_id,name_bn,name_en').eq('tenant_id', context.tenantId).order('name_bn'),
  ]);

  const teachers = teachersRes.data || [];
  const leaves = leavesRes.data || [];
  const academicYearId = yearRes.data?.id || null;
  const { data: assignments } = academicYearId
    ? await supabase.from('teacher_class_assignments')
        .select('id,teacher_id,class_id,section_id,subject_id')
        .eq('tenant_id', context.tenantId)
        .eq('academic_year_id', academicYearId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    : { data: [] as Array<{ id: string; teacher_id: string; class_id: string; section_id: string; subject_id: string | null }> };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{dict.teachers.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{context.tenantName} · {dict.teachers.subtitle}</p>
        </div>
      </div>
      <TeachersView teachers={teachers} leaves={leaves} />
      <TeacherAssignmentsPanel
        teachers={teachers}
        classes={classesRes.data || []}
        sections={sectionsRes.data || []}
        subjects={subjectsRes.data || []}
        assignments={assignments || []}
        academicYearId={academicYearId}
      />
    </div>
  );
}
