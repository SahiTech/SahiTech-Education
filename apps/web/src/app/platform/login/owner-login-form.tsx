'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const OWNER_EMAIL='helpline.sahitech@gmail.com';

export default function OwnerLoginForm(){
  const router=useRouter();
  const [email,setEmail]=useState(OWNER_EMAIL);
  const [password,setPassword]=useState('');
  const [code,setCode]=useState('');
  const [factorId,setFactorId]=useState('');
  const [qr,setQr]=useState('');
  const [secret,setSecret]=useState('');
  const [step,setStep]=useState<'credentials'|'enroll'|'challenge'>('credentials');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function beginLogin(e:React.FormEvent){
    e.preventDefault(); setBusy(true);setError('');
    try{
      if(email.trim().toLowerCase()!==OWNER_EMAIL) throw new Error('This login is reserved for the designated Global Platform Owner.');
      const supabase=createClient();
      const {data,error}=await supabase.auth.signInWithPassword({email:OWNER_EMAIL,password});
      if(error||!data.user) throw new Error('Sign-in failed. Check the owner credentials and verified email status.');
      const {error:bindError}=await (supabase.rpc as any)('bind_platform_owner');
      if(bindError) throw new Error('The verified owner identity could not be bound. Confirm the designated email address is verified in Supabase Auth.');
      const {data:factors,error:factorsError}=await supabase.auth.mfa.listFactors();
      if(factorsError) throw factorsError;
      const verified=factors.totp.find((factor:any)=>factor.status==='verified');
      if(verified){
        setFactorId(verified.id);setStep('challenge');
      }else{
        const pending=factors.totp.find((factor:any)=>factor.status==='unverified');
        if(pending){
          setFactorId(pending.id);
          throw new Error('An unfinished authenticator setup exists. Remove the unverified factor in Auth settings, then restart owner setup.');
        }
        const {data:enrolled,error:enrollError}=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'MDI Global Platform Owner'});
        if(enrollError||!enrolled) throw enrollError||new Error('MFA enrollment failed.');
        setFactorId(enrolled.id);setQr(enrolled.totp.qr_code);setSecret(enrolled.totp.secret);setStep('enroll');
      }
    }catch(err:any){setError(err.message||'Authentication failed.');}
    finally{setBusy(false);}
  }

  async function verifyCode(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError('');
    try{
      const supabase=createClient();
      const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId});
      if(challengeError||!challenge) throw challengeError||new Error('Could not start MFA challenge.');
      const {error:verifyError}=await supabase.auth.mfa.verify({factorId,challengeId:challenge.id,code:code.trim()});
      if(verifyError) throw new Error('Invalid authenticator code. Try the current six-digit code.');
      const {data:owner,error:ownerError}=await (supabase.rpc as any)('is_platform_owner');
      if(ownerError||owner!==true) throw new Error('Owner authorization check failed after MFA.');
      router.replace('/platform');router.refresh();
    }catch(err:any){setError(err.message||'MFA verification failed.');}
    finally{setBusy(false);}
  }

  return <div className="mt-7 space-y-4">
    {error&&<div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {step==='credentials'&&<form onSubmit={beginLogin} className="space-y-3">
      <div><label className="mb-1 block text-xs font-bold text-slate-700">Owner email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></div>
      <div><label className="mb-1 block text-xs font-bold text-slate-700">Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></div>
      <button disabled={busy} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy?'Signing in...':'Continue securely'}</button>
    </form>}
    {step==='enroll'&&<form onSubmit={verifyCode} className="space-y-4">
      <p className="text-sm font-semibold text-slate-800">Set up an authenticator app</p>
      {qr&&<div className="flex justify-center rounded-lg bg-white p-3"><img src={`data:image/svg+xml;utf8,${encodeURIComponent(qr)}`} alt="Authenticator QR code" className="h-48 w-48"/></div>}
      <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] font-bold text-slate-500">Manual setup key</p><p className="mt-1 break-all font-mono text-sm text-slate-900">{secret}</p></div>
      <p className="text-xs leading-5 text-slate-500">Scan the QR code with an authenticator app. Store the secret securely and never share it.</p>
      <CodeInput value={code} onChange={setCode}/>
      <button disabled={busy||code.trim().length!==6} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Verifying...':'Verify and enable MFA'}</button>
    </form>}
    {step==='challenge'&&<form onSubmit={verifyCode} className="space-y-4">
      <p className="text-sm leading-6 text-slate-600">Enter the current six-digit code from the registered authenticator app.</p>
      <CodeInput value={code} onChange={setCode}/>
      <button disabled={busy||code.trim().length!==6} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Verifying...':'Verify MFA and open Owner Portal'}</button>
    </form>}
  </div>
}
function CodeInput({value,onChange}:{value:string;onChange:(value:string)=>void}){
  return <div><label className="mb-1 block text-xs font-bold text-slate-700">Authenticator code</label><input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={value} onChange={e=>onChange(e.target.value.replace(/\D/g,'').slice(0,6))} required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-center font-mono text-xl tracking-[0.5em]"/></div>
}
