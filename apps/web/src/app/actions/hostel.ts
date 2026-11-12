'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export interface CreateHostelRoomInput {
  buildingName: string;
  floorNumber: string;
  roomNumber: string;
  roomType?: string;
  totalBeds: number;
  wardenName?: string;
  wardenPhone?: string;
}

export async function createHostelRoom(input: CreateHostelRoomInput) {
  try {
    const context = await requirePermission('manage_hostel');
    const supabase = await createClient();

    if (!input.buildingName?.trim() || !input.roomNumber?.trim()) {
      return { success: false, error: 'ভবনের নাম ও কক্ষ নম্বর আবশ্যক।' };
    }

    const { data: room, error } = await supabase
      .from('hostel_rooms')
      .insert({
        tenant_id: context.tenantId,
        building_name: input.buildingName.trim(),
        floor_number: input.floorNumber.trim(),
        room_number: input.roomNumber.trim(),
        room_type: input.roomType || 'general',
        total_beds: Number(input.totalBeds) || 6,
        warden_name: input.wardenName?.trim() || null,
        warden_phone: input.wardenPhone?.trim() || null,
        is_active: true,
      })
      .select('id')
      .single();

    if (error || !room) {
      return { success: false, error: `কক্ষ তৈরি ব্যর্থ হয়েছে: ${error?.message}` };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'hostel.room_created',
      entityName: 'hostel_rooms',
      entityId: room.id,
    });

    revalidatePath('/dashboard/hostel');
    return { success: true, roomId: room.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function allocateHostelBed(params: {
  studentId: string;
  roomId: string;
  bedNumber: string;
  allocationStart?: string;
  remarks?: string;
}) {
  try {
    const context = await requirePermission('manage_hostel');
    const supabase = await createClient();

    // 1. Check if bed is already occupied
    const { data: existingBed } = await supabase
      .from('hostel_allocations')
      .select('id')
      .eq('room_id', params.roomId)
      .eq('bed_number', params.bedNumber)
      .eq('is_active', true)
      .maybeSingle();

    if (existingBed) {
      return { success: false, error: `সিট/বেড নং '${params.bedNumber}' ইতিমধ্যে অন্য ছাত্রের জন্য বরাদ্দ রয়েছে।` };
    }

    // 2. Insert allocation
    const { data: alloc, error } = await supabase
      .from('hostel_allocations')
      .insert({
        tenant_id: context.tenantId,
        student_id: params.studentId,
        room_id: params.roomId,
        bed_number: params.bedNumber,
        allocation_start: params.allocationStart || new Date().toISOString().split('T')[0],
        is_active: true,
        remarks: params.remarks?.trim() || null,
      })
      .select('id')
      .single();

    if (error || !alloc) {
      return { success: false, error: `সিট বরাদ্দ ব্যর্থ হয়েছে: ${error?.message}` };
    }

    // Update student's residential flag
    await supabase
      .from('students')
      .update({ is_residential: true })
      .eq('id', params.studentId);

    revalidatePath('/dashboard/hostel');
    revalidatePath('/dashboard/students');
    return { success: true, allocationId: alloc.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

export async function vacateHostelBed(allocationId: string) {
  try {
    const context = await requirePermission('manage_hostel');
    const supabase = await createClient();

    const { error } = await supabase
      .from('hostel_allocations')
      .update({
        is_active: false,
        allocation_end: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', allocationId)
      .eq('tenant_id', context.tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/hostel');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

