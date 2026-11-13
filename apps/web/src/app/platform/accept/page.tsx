import AcceptInvitationForm from './accept-invitation-form';

export default async function AcceptInvitationPage({searchParams}:{searchParams:Promise<{token?:string}>}){
  const {token=''}=await searchParams;
  return <div className="flex min-h-[75vh] items-center justify-center bg-slate-50 px-4 py-12">
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">SahiTech Education · MDI</p>
      <h1 className="mt-2 text-center text-2xl font-black text-slate-900">মাদরাসা invitation গ্রহণ</h1>
      <p className="mt-2 text-center text-sm text-slate-500">নির্ধারিত অফিসিয়াল ইমেইল দিয়ে account তৈরি বা sign in করুন। ইমেইল যাচাই ছাড়া invitation গ্রহণ করা যাবে না।</p>
      <AcceptInvitationForm token={token}/>
    </div>
  </div>
}
