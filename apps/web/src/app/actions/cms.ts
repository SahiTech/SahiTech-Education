'use server';

import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/context';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

export interface CreateNoticeInput {
  titleBn: string;
  titleEn: string;
  contentBn: string;
  contentEn?: string;
  category?: string;
  attachmentUrl?: string;
  isPublic: boolean;
  isPinned?: boolean;
}

export async function createTenantNotice(input: CreateNoticeInput) {
  try {
    const context = await requirePermission('manage_curriculum');
    const supabase = await createClient();

    if (!input.titleBn?.trim() || !input.contentBn?.trim()) {
      return { success: false, error: 'বিজ্ঞপ্তির শিরোনাম ও বিবরণ আবশ্যক।' };
    }

    const { data: notice, error } = await supabase
      .from('tenant_notices')
      .insert({
        tenant_id: context.tenantId,
        title_bn: input.titleBn.trim(),
        title_en: input.titleEn?.trim() || input.titleBn.trim(),
        content_bn: input.contentBn.trim(),
        content_en: input.contentEn?.trim() || null,
        category: input.category || 'general',
        attachment_url: input.attachmentUrl || null,
        is_public: input.isPublic,
        is_pinned: input.isPinned || false,
      })
      .select('id')
      .single();

    if (error || !notice) {
      return { success: false, error: `বিজ্ঞপ্তি প্রকাশ ব্যর্থ: ${error?.message}` };
    }

    await logAuditEvent({
      tenantId: context.tenantId,
      actorId: context.userId,
      actorRole: context.role,
      action: 'cms.notice_created',
      entityName: 'tenant_notices',
      entityId: notice.id,
      newState: { title: input.titleBn, isPublic: input.isPublic },
    });

    revalidatePath('/dashboard');
    return { success: true, noticeId: notice.id };
  } catch (err: any) {
    return { success: false, error: err.message || 'অনাকাঙ্ক্ষিত ত্রুটি।' };
  }
}

