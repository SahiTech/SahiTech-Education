import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { issueApplicationInvitation, updateApplicationStatus, activateTenant } from '@/app/actions/platform';

const OWNER_EMAIL = 'helpline.sahitech@gmail.com';

export const dynamic = 'force-dynamic';

export default async function PlatformOwnerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== OWNER_EMAIL) redirect('/platform/login');
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') redirect('/platform/login');
  const { data: isOwner } = await (supabase.rpc as any)('is_platform_owner');
  if (isOwner !== true) redirect('/platform/login');

  const [{ data: applications }, { data: tenants }, { data: invitations }] = await Promise.all([
    (supabase.from('madrasa_applications') as any).select('*').order('submitted_at', { ascending: false }).limit(100),
    (supabase.from('tenants') as any).select('id,name,code,subdomain,onboarding_step,onboarding_completed_at,platform_status,source_application_id').eq('platform_status','pending_activation').not('onboarding_completed_at','is',null).order('onboarding_completed_at',{ascending:true}),
    (supabase.from('platform_invitations') as any).select('id,application_id,invitee_email,status,expires_at,created_at').order('created_at',{ascending:false}).limit(30),
  ]);

  const applicationIds = (applications || []).map((app:any)=>app.id);
  const { data: documentRows } = applicationIds.length
    ? await (supabase.from('madrasa_application_documents') as any).select('*').in('application_id',applicationIds).order('uploaded_at',{ascending:false})
    : { data: [] as any[] };
  const documentsWithLinks = await Promise.all((documentRows || []).map(async (doc:any) => {
    const { data } = await supabase.storage.from('madrasa-application-documents').createSignedUrl(doc.storage_object_path, 300);
    return { ...doc, signedUrl: data?.signedUrl || null };
  }));
  const documentsByApplication = new Map<string,any[]>();
  for (const doc of documentsWithLinks) documentsByApplication.set(doc.application_id,[...(documentsByApplication.get(doc.application_id)||[]),doc]);
  const invitationByApplication = new Map((invitations || []).map((item:any)=>[item.application_id,item]));
  const pending = (applications || []).filter((app:any)=>['pending','under_review','info_requested'].includes(app.status));

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">SahiTech Education · MDI</p><h1 className="mt-1 text-3xl font-black text-slate-900">Global Platform Owner</h1><p className="mt-1 text-sm text-slate-500">Authenticated as {user.email} · MFA verified</p></div>
          <form action={async()=>{'use server'; const client=await createClient(); await client.auth.signOut(); redirect('/platform/login');}}><button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Sign out</button></form>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <Metric label="Total applications" value={(applications||[]).length}/>
          <Metric label="Awaiting review" value={pending.length}/>
          <Metric label="Ready for activation" value={(tenants||[]).length}/>
        </section>

        <section className="space-y-4">
          <div><h2 className="text-xl font-bold text-slate-900">Madrasa applications</h2><p className="text-sm text-slate-500">Verify documents outside this dashboard before issuing an invitation. No tenant is created at approval time.</p></div>
          {pending.length===0 ? <Empty>No applications are waiting for review.</Empty> : pending.map((app:any)=>(
            <article key={app.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-slate-900">{app.institution_name}</h3><span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800">{app.status}</span></div>
                  <p className="text-sm text-slate-600">{app.contact_person_name} · {app.contact_email} · {app.contact_phone}</p>
                  <p className="text-xs text-slate-500">{app.institution_type} · {app.board_affiliation||'Board not specified'} · {app.district||'District not specified'}</p>
                  <p className="text-xs text-slate-500">Requested code: <b>{app.requested_code||'Missing'}</b> · Subdomain: <b>{app.requested_subdomain||'Missing'}</b></p>
                  {app.registration_number && <p className="text-xs text-slate-500">Registration: {app.registration_number}</p>}
                  {app.address && <p className="text-xs text-slate-500">{app.address}</p>}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-bold text-slate-700">Verification documents ({(documentsByApplication.get(app.id)||[]).length})</p>
                    {(documentsByApplication.get(app.id)||[]).length===0 ? <p className="text-[11px] text-slate-500">No supporting documents uploaded.</p> : <ul className="space-y-1">{(documentsByApplication.get(app.id)||[]).map((doc:any)=><li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="text-slate-700">{doc.document_type} · {doc.original_file_name}</span>{doc.signedUrl&&<a href={doc.signedUrl} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 underline">Open securely</a>}</li>)}</ul>}
                  </div>
                  {app.application_note && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{app.application_note}</p>}
                  {app.review_note && <p className="text-xs text-amber-700">Previous note: {app.review_note}</p>}
                </div>
                <div className="flex w-full flex-col gap-2 lg:max-w-xs">
                  <form action={issueApplicationInvitation}><input type="hidden" name="applicationId" value={app.id}/><button disabled={!app.requested_code||!app.requested_subdomain} className="w-full rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Approve & issue invitation</button></form>
                  <form action={updateApplicationStatus} className="space-y-2"><input type="hidden" name="applicationId" value={app.id}/><select name="status" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"><option value="under_review">Under review</option><option value="info_requested">Request more information</option><option value="rejected">Reject application</option></select><input name="reviewNote" placeholder="Review note / reason" maxLength={2000} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"/><button className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Save review decision</button></form>
                  {invitationByApplication.has(app.id) && <p className="text-[11px] text-slate-500">Invitation: {(invitationByApplication.get(app.id) as any).status} · {(invitationByApplication.get(app.id) as any).invitee_email}</p>}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-4">
          <div><h2 className="text-xl font-bold text-slate-900">Final tenant activation</h2><p className="text-sm text-slate-500">Only fully onboarded tenants appear here. Activation is a separate owner decision.</p></div>
          {(tenants||[]).length===0 ? <Empty>No tenants are waiting for final activation.</Empty> : (tenants||[]).map((tenant:any)=>(
            <article key={tenant.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h3 className="font-bold text-slate-900">{tenant.name}</h3><p className="text-xs text-slate-500">{tenant.code} · {tenant.subdomain||'No subdomain'} · Onboarding completed {new Date(tenant.onboarding_completed_at).toLocaleDateString('en-GB')}</p></div>
              <form action={activateTenant}><input type="hidden" name="tenantId" value={tenant.id}/><button className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white">Verify & activate tenant</button></form>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black tabular-nums text-slate-900">{value}</p></div>}
function Empty({children}:{children:ReactNode}){return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{children}</div>}
