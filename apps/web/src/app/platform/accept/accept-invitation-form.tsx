'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';

export default function AcceptInvitationForm({token}:{token:string}){
  const router=useRouter();
  const [email,setEmail]=useState('');
  const [name,setName]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  async function accept(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      if(!/^[A-Fa-f0-9]{64}$/.test(token)) throw new Error('Invitation link is invalid or incomplete.');
      const supabase=createClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){
        const {data,error:signupError}=await supabase.auth.signUp({
          email:email.trim().toLowerCase(),
          password,
          options:{
            data:{full_name_en:name.trim()},
            emailRedirectTo:`${window.location.origin}/platform/accept?token=${encodeURIComponent(token)}`,
          }
        });
        if(signupError) throw signupError;
        if(!data.session){
          setMessage('Account registration started. Please verify your email using the message sent by Supabase Auth, then reopen this invitation link to complete acceptance.');
          return;
        }
      }else if(user.email?.toLowerCase()!==email.trim().toLowerCase() && email.trim()){
        throw new Error('The signed-in email does not match the invited email. Sign out and use the invited address.');
      }

      const {data:result,error:acceptError}=await (supabase.rpc as any)('accept_platform_invitation',{p_token:token.toUpperCase()});
      if(acceptError) throw new Error('Invitation acceptance failed. Confirm the email address is verified and matches the invitation, and that the link has not expired or been used.');
      const tenantId=result?.tenant_id;
      if(!tenantId) throw new Error('The tenant was not provisioned. Contact platform support.');
      document.cookie=`m_active_tenant=${tenantId}; Path=/; SameSite=Lax; Secure`;
      setMessage('Invitation accepted. Your Madrasa workspace has been provisioned and is awaiting onboarding and final platform review.');
      router.replace('/onboarding');router.refresh();
    }catch(err:any){setError(err.message||'Could not accept this invitation.');}
    finally{setBusy(false);}
  }

  return <form onSubmit={accept} className="mt-7 space-y-4">
    {!token||!/^[A-Fa-f0-9]{64}$/.test(token)?<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Invitation token is invalid.</div>:null}
    {error&&<div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {message&&<div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
    <div><label className="mb-1 block text-xs font-bold text-slate-700">Invited email address</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></div>
    <div><label className="mb-1 block text-xs font-bold text-slate-700">Full name</label><input value={name} onChange={e=>setName(e.target.value)} required autoComplete="name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/></div>
    <div><label className="mb-1 block text-xs font-bold text-slate-700">Create password (or enter existing password)</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={10} autoComplete="new-password" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"/><p className="mt-1 text-[11px] text-slate-500">Use at least 10 characters. Existing invited users may sign in with their current password.</p></div>
    <button type="submit" disabled={busy||!token||!/^[A-Fa-f0-9]{64}$/.test(token)} className="w-full rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?'Processing invitation...':'Create account / sign in and accept invitation'}</button>
  </form>
}
