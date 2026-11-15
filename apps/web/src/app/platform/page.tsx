import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { issueApplicationInvitation, updateApplicationStatus, activateTenant, reviewApplicationDocument } from '@/app/actions/platform';

export const dynamic = 'force-dynamic';

export default async function PlatformOwnerDashboard({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const params = await searchParams;
  const searchQuery = (params.q || '').trim().toLocaleLowerCase();
  const statusFilter = params.status || 'action_required';
  const pageSize = 20;
  const requestedPage = Math.max(1, Number.parseInt(params.page || '1', 10) || 1);
  const supabase = await createClient();
  // The parent platform layout already enforces authenticated Owner + AAL2 access.
  // Avoid repeating the same three auth/RPC round-trips on every dashboard navigation.
  const applicationColumns = 'id,institution_name,institution_name_bn,institution_type,board_affiliation,registration_number,contact_person_name,contact_email,contact_phone,district,address,application_note,requested_code,requested_subdomain,status,review_note,submitted_at';
  const documentColumns = 'id,application_id,document_type,storage_object_path,original_file_name,mime_type,file_size_bytes,uploaded_at,verification_status,review_note';
  const [{ data: applications }, { data: tenants }, { data: auditLogs }] = await Promise.all([
    (supabase.from('madrasa_applications') as any).select(applicationColumns).order('submitted_at', { ascending: false }).limit(100),
    (supabase.from('tenants') as any).select('id,name,code,subdomain,onboarding_step,onboarding_completed_at,platform_status,source_application_id').eq('platform_status','pending_activation').not('onboarding_completed_at','is',null).order('onboarding_completed_at',{ascending:true}),
    (supabase.from('platform_audit_logs') as any).select('id,actor_user_id,actor_aal,action,entity_type,entity_id,tenant_id,created_at').order('created_at',{ascending:false}).limit(20),
  ]);

  const applicationIds = (applications || []).map((app:any)=>app.id);
  const { data: invitations } = applicationIds.length
    ? await (supabase.from('platform_invitations') as any).select('id,application_id,invitee_email,status,expires_at,created_at').in('application_id',applicationIds).order('created_at',{ascending:false})
    : { data: [] as any[] };

  const invitationByApplication = new Map<string, any>();
  for (const item of (invitations || [])) {
    if (!invitationByApplication.has(item.application_id)) invitationByApplication.set(item.application_id, item);
  }
  const pending = (applications || []).filter((app:any) => {
    if (['pending','under_review','info_requested'].includes(app.status)) return true;
    if (app.status !== 'approved') return false;
    return invitationByApplication.get(app.id)?.status !== 'accepted';
  });
  // "All review queue" must include every application, not only pending items.
  const statusSource = statusFilter === 'all'
    ? (applications || [])
    : statusFilter === 'action_required'
      ? pending
      : statusFilter === 'approved'
        ? (applications || []).filter((app:any) => app.status === 'approved' && invitationByApplication.get(app.id)?.status !== 'accepted')
        : (applications || []).filter((app:any) => app.status === statusFilter);
  const filteredApplications = statusSource.filter((app:any) => {
    const matchesQuery = !searchQuery || [
      app.institution_name, app.institution_name_bn, app.contact_person_name,
      app.contact_email, app.contact_phone, app.district, app.requested_code,
      app.requested_subdomain,
    ].some((value:any) => String(value || '').toLocaleLowerCase().includes(searchQuery));
    return matchesQuery;
  });
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const visiblePending = filteredApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Load documents and create short-lived private links only for the visible page.
  // This avoids signing every document for all 100 applications on every request.
  const visibleIds = visiblePending.map((app:any) => app.id);
  const { data: documentRows } = visibleIds.length
    ? await (supabase.from('madrasa_application_documents') as any)
        .select(documentColumns).in('application_id', visibleIds).order('uploaded_at', { ascending: false })
    : { data: [] as any[] };
  const documentsWithLinks = await Promise.all((documentRows || []).map(async (doc:any) => {
    const { data } = await supabase.storage.from('madrasa-application-documents').createSignedUrl(doc.storage_object_path, 300);
    return { ...doc, signedUrl: data?.signedUrl || null };
  }));
  const documentsByApplication = new Map<string,any[]>();
  for (const doc of documentsWithLinks) {
    documentsByApplication.set(doc.application_id, [...(documentsByApplication.get(doc.application_id) || []), doc]);
  }

  return (
    <div className="min-h-screen px-0 py-0">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <header id="overview" className="flex flex-col gap-5 rounded-3xl bg-gradient-to-br from-[#123b32] via-[#174c3d] to-[#24664f] p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-8 xl:flex-row xl:items-end xl:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-100/70">SahiTech Education · MDI</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Global Owner Console</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/75">A single control centre for institutional onboarding, document verification, tenant activation and platform governance.</p><div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-50"><span className="h-2 w-2 rounded-full bg-emerald-300"/> Secure session · MFA verified</div></div>
          <form action={async()=>{'use server'; const client=await createClient(); await client.auth.signOut(); redirect('/platform/login');}}><button className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">Sign out</button></form>
        </header>
        <section className="grid gap-4 sm:grid-cols-3">
          <Metric label="Total applications · latest 100" value={(applications||[]).length}/>
          <Metric label="Awaiting owner review" value={pending.length}/>
          <Metric label="Ready for activation" value={(tenants||[]).length}/>
        </section>
        <section id="applications" className="scroll-mt-28 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold text-slate-900">Madrasa applications</h2><p className="text-sm text-slate-500">Verify documents before issuing an invitation. Approval alone does not create a tenant.</p></div><span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">{pending.length} require attention</span></div>
          <form method="get" className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_210px_auto_auto] sm:items-center">
            <label className="sr-only" htmlFor="application-search">Search applications</label>
            <input id="application-search" name="q" defaultValue={params.q || ''} placeholder="Search institution, contact, email, district or code…" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"/>
            <label className="sr-only" htmlFor="application-status">Filter by status</label>
            <select id="application-status" name="status" defaultValue={statusFilter} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
              <option value="action_required">Action required</option><option value="all">All review queue</option><option value="pending">Pending</option><option value="under_review">Under review</option><option value="info_requested">Information requested</option><option value="approved">Approved / invitation pending</option>
            </select>
            <button className="rounded-xl bg-[#174c3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#10392f]">Apply filters</button>
            <a href="/platform#applications" className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50">Reset</a>
          </form>
          <p className="text-xs text-slate-500">Showing {visiblePending.length} of {filteredApplications.length} matching applications · page {currentPage} of {totalPages}. Search covers the latest 100 received applications.</p>
          {filteredApplications.length===0 ? <Empty>{statusFilter === 'action_required' ? 'No applications are waiting for review.' : 'No applications match these filters. Try another search or reset the filters.'}</Empty> : visiblePending.map((app:any)=>(
            <article key={app.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-slate-900">{app.institution_name}</h3><span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">{app.status}</span></div>
                  <p className="text-sm text-slate-600">{app.contact_person_name} · {app.contact_email} · {app.contact_phone}</p>
                  <p className="text-xs text-slate-500">{app.institution_type} · {app.board_affiliation||'Board not specified'} · {app.district||'District not specified'}</p>
                  <p className="text-xs text-slate-500">Requested code: <b>{app.requested_code||'Missing'}</b> · Subdomain: <b>{app.requested_subdomain||'Missing'}</b></p>
                  {app.registration_number && <p className="text-xs text-slate-500">Registration: {app.registration_number}</p>}
                  {app.address && <p className="text-xs text-slate-500">{app.address}</p>}
                  {app.application_note && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{app.application_note}</p>}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-xs font-bold text-slate-700">Supporting documents ({(documentsByApplication.get(app.id)||[]).length})</p>
                    {(documentsByApplication.get(app.id)||[]).map((doc:any)=><div key={doc.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-800">{doc.original_file_name}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">{doc.verification_status}</span></div>
                      <p className="mt-1 text-[10px] text-slate-500">{doc.document_type} · {(doc.file_size_bytes/1024/1024).toFixed(2)} MB</p>
                      {doc.signedUrl&&<a href={doc.signedUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-700 underline">Open private document</a>}
                      <form action={reviewApplicationDocument} className="mt-2 flex flex-wrap gap-2">
                        <input type="hidden" name="documentId" value={doc.id}/><input name="reviewNote" placeholder="Review note (optional)" maxLength={2000} className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"/>
                        <button name="status" value="verified" className="rounded bg-emerald-700 px-2 py-1 text-[11px] font-bold text-white">Verify</button>
                        <button name="status" value="rejected" className="rounded border border-red-300 px-2 py-1 text-[11px] font-bold text-red-700">Reject</button>
                      </form>
                      {doc.review_note&&<p className="mt-1 text-[10px] text-amber-700">{doc.review_note}</p>}
                    </div>)}
                    {(documentsByApplication.get(app.id)||[]).length===0&&<p className="text-xs text-amber-700">No supporting documents uploaded yet. Invitation remains blocked.</p>}
                  </div>
                  {app.review_note && <p className="text-xs text-amber-700">Previous note: {app.review_note}</p>}
                </div>
                <div className="flex w-full flex-col gap-2 lg:max-w-xs">
                  <form action={issueApplicationInvitation}><input type="hidden" name="applicationId" value={app.id}/><button disabled={!app.requested_code||!app.requested_subdomain||!(documentsByApplication.get(app.id)||[]).some((doc:any)=>doc.verification_status==='verified')||(documentsByApplication.get(app.id)||[]).some((doc:any)=>doc.verification_status==='pending')||((invitationByApplication.get(app.id) as any)?.status==='accepted')} className="w-full rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{(invitationByApplication.get(app.id) as any)?.status==='pending'?'Reissue invitation':app.status==='approved'?'Issue invitation':'Approve & issue invitation'}</button></form>
                  {!(documentsByApplication.get(app.id)||[]).some((doc:any)=>doc.verification_status==='verified') ? <p className="text-[10px] text-amber-700">At least one supporting document must be verified.</p> : (documentsByApplication.get(app.id)||[]).some((doc:any)=>doc.verification_status==='pending') ? <p className="text-[10px] text-amber-700">Review all pending document uploads before invitation.</p> : null}
                  <form action={updateApplicationStatus} className="space-y-2"><input type="hidden" name="applicationId" value={app.id}/><select name="status" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"><option value="under_review">Under review</option><option value="info_requested">Request more information</option><option value="rejected">Reject application</option></select><input name="reviewNote" placeholder="Review note / reason" maxLength={2000} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"/><button className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Save review decision</button></form>
                  {invitationByApplication.has(app.id) && <p className="text-[11px] text-slate-500">Invitation: {(invitationByApplication.get(app.id) as any).status} · {(invitationByApplication.get(app.id) as any).invitee_email}</p>}
                </div>
              </div>
            </article>
          ))}
          {totalPages > 1 && <nav aria-label="Application pages" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="text-xs text-slate-500">Page {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
              {currentPage > 1 && <a className="rounded-lg border px-3 py-2 text-xs font-semibold" href={`/platform?q=${encodeURIComponent(params.q || '')}&status=${encodeURIComponent(statusFilter)}&page=${currentPage - 1}#applications`}>Previous</a>}
              {currentPage < totalPages && <a className="rounded-lg border px-3 py-2 text-xs font-semibold" href={`/platform?q=${encodeURIComponent(params.q || '')}&status=${encodeURIComponent(statusFilter)}&page=${currentPage + 1}#applications`}>Next</a>}
            </div>
          </nav>}
        </section>

        <section id="institutions" className="scroll-mt-28 space-y-4">
          <div><h2 className="text-xl font-bold text-slate-900">Final tenant activation</h2><p className="text-sm text-slate-500">Only fully onboarded tenants appear here. Activation is a separate owner decision.</p></div>
          {(tenants||[]).length===0 ? <Empty>No tenants are waiting for final activation.</Empty> : (tenants||[]).map((tenant:any)=>(
            <article key={tenant.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="font-bold text-slate-900">{tenant.name}</h3><p className="text-xs text-slate-500">{tenant.code} · {tenant.subdomain||'No subdomain'} · Onboarding completed {new Date(tenant.onboarding_completed_at).toLocaleDateString('en-GB')}</p></div>
              <form action={activateTenant}><input type="hidden" name="tenantId" value={tenant.id}/><button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white">Verify & activate tenant</button></form>
            </article>
          ))}
        </section>

        <section id="audit" className="scroll-mt-28 space-y-4">
          <div><h2 className="text-xl font-bold text-slate-900">Platform audit trail</h2><p className="text-sm text-slate-500">Append-only lifecycle events. Visible only to the verified Global Platform Owner.</p></div>
          {(auditLogs||[]).length===0 ? <Empty>No platform lifecycle events recorded yet.</Empty> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {(auditLogs||[]).map((event:any)=><div key={event.id} className="flex flex-col gap-1 border-b border-slate-100 px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-semibold text-slate-800">{event.action}</p><p className="text-[11px] text-slate-500">{event.entity_type} · {event.entity_id||'—'} · Actor {event.actor_user_id||'system/public'} · {event.actor_aal||'no AAL claim'}</p></div>
              <time className="text-[11px] tabular-nums text-slate-500">{new Date(event.created_at).toLocaleString('en-GB')}</time>
            </div>)}
          </div>}
        </section>
      </div>
    </div>
  );
}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black tabular-nums text-slate-900">{value}</p></div>}
function Empty({children}:{children:ReactNode}){return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{children}</div>}
