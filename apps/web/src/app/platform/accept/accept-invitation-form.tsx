'use client';

import {useEffect, useState, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';

export default function AcceptInvitationForm(){
  const router=useRouter();
  const [mode,setMode]=useState<'signup'|'signin'>('signup');
  const [token,setToken]=useState('');
  const [tokenReady,setTokenReady]=useState(false);
  const [email,setEmail]=useState('');
  const [name,setName]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  useEffect(()=>{
    const params=new URLSearchParams(window.location.hash.replace(/^#/,''));
    const value=params.get('token')||'';
    setToken(value);
    window.history.replaceState(null,'',window.location.pathname+window.location.search);
    setTokenReady(true);
  },[]);

  async function accept(e:FormEvent){
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      if(!/^[A-Fa-f0-9]{64}$/.test(token)) throw new Error('Invitation link is invalid or incomplete.');
      const supabase=createClient();
      const {data:{user:existing}}=await supabase.auth.getUser();
      if(existing && existing.email?.toLowerCase()!==email.trim().toLowerCase()){
        await supabase.auth.signOut();
      }
      const {data:{user:current}}=await supabase.auth.getUser();
      if(!current){
        if(mode==='signup'){
          const redirectTo=`${window.location.origin}/auth/callback?next=${encodeURIComponent(`/platform/accept#token=${token}`)}`;
          const {data,error:signupError}=await supabase.auth.signUp({
            email:email.trim().toLowerCase(),password,
            options:{data:{full_name_en:name.trim()},emailRedirectTo:redirectTo}
          });
          if(signupError) throw signupError;
          if(!data.session){
            setMessage('Registration received. Verify the invitation email sent by Supabase Auth. The verification link will return here to finish tenant setup.');
            return;
          }
        }else{
          const {error:loginError}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
          if(loginError) throw new Error('Sign-in failed. Use the invited email address and its password.');
        }
      }else if(current.email?.toLowerCase()!==email.trim().toLowerCase()){
        throw new Error('The signed-in email does not match the invited email. Sign out and use the invited address.');
      }

      const {data:result,error:acceptError}=await (supabase.rpc as any)('accept_platform_invitation',{p_token:token.toUpperCase()});
      if(acceptError) throw new Error('Invitation acceptance failed. Confirm that the email is verified and matches the invitation, and that the link has not expired or been used.');
      const tenantId=result?.tenant_id;
      if(!tenantId) throw new Error('The tenant was not provisioned. Contact platform support.');
      document.cookie=`m_active_tenant=${tenantId}; Path=/; SameSite=Lax; Secure`;
      setMessage('Invitation accepted. Your Madrasa workspace is provisioned and awaiting onboarding and final platform review.');
      router.replace('/onboarding');router.refresh();
    }catch(err:any){setError(err.message||'Could not accept this invitation.');}
    finally{setBusy(false);}
  }

  if(!tokenReady) return <div className="mt-7 rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">Checking secure invitation link...</div>;

  return <form onSubmit={accept} className="mt-7 space-y-4">
    {!token||!/^[A-Fa-f0-9]{64}$/.test(token)?<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Invitation token is invalid.</div>:null}
    <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
      <button type="button" onClick={()=>setMode('signup')} className={mode==='signup'?'rounded-md bg-white p-2 text-emerald-800 shadow-sm':'p-2 text-slate-500'}>New account</button>
      <button type="button" onClick={()=>setMode('signin')} className={mode==='signin'?'rounded-md bg-white p-2 text-emerald-800 shadow-sm':'p-2 text-slate-500'}>Existing account</button>
    </div>
    {error&&<div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {message&&<div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
    <div><label className="mb-1 block text-xs font-bold text-slate-700">Invited email address</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></div>
    {mode==='signup'&&<div><label className="mb-1 block text-xs font-bold text-slate-700">Full name</label><input value={name} onChange={e=>setName(e.target.value)} required autoComplete="name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></div>}
    <div><label className="mb-1 block text-xs font-bold text-slate-700">{mode==='signup'?'Create password':'Password'}</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={10} autoComplete={mode==='signup'?'new-password':'current-password'} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/>{mode==='signup'&&<p className="mt-1 text-[11px] text-slate-500">Use at least 10 characters.</p>}</div>
    <button type="submit" disabled={busy||!tokenReady||!/^[A-Fa-f0-9]{64}$/.test(token)} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Processing invitation...':mode==='signup'?'Create account and accept invitation':'Sign in and accept invitation'}</button>
  </form>
}
