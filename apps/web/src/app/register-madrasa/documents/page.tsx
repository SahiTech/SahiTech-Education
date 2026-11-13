import ResumeApplicationDocuments from './resume-application-documents';

export default async function ResumeDocumentsPage({searchParams}:{searchParams:Promise<{applicationId?:string}>}){
  const {applicationId=''}=await searchParams;
  return <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12">
    <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">SahiTech Education · MDI</p>
      <h1 className="mt-2 text-2xl font-black text-slate-900">Continue application documents</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Use the private link sent to the applicant email address to upload or complete supporting documents.</p>
      <ResumeApplicationDocuments applicationId={applicationId}/>
    </div>
  </div>
}
