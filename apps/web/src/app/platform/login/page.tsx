import OwnerLoginForm from './owner-login-form';

export default function PlatformLoginPage(){
  return <div className="flex min-h-[75vh] items-center justify-center bg-slate-50 px-4 py-12">
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">SahiTech Education</p>
      <h1 className="mt-2 text-center text-2xl font-black text-slate-900">Global Platform Owner</h1>
      <p className="mt-2 text-center text-sm text-slate-500">Restricted access · Email/password + mandatory authenticator MFA</p>
      <OwnerLoginForm/>
    </div>
  </div>
}
