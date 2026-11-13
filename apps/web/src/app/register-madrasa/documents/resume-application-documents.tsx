'use client';

import {useEffect,useState} from 'react';
import {ApplicationDocumentUpload} from '../document-upload';
import {AlertCircle,Loader2} from 'lucide-react';

export default function ResumeApplicationDocuments({applicationId}:{applicationId:string}){
  const [token,setToken]=useState('');
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.hash.replace(/^#/,''));
    const value=params.get('token')||'';
    setToken(value);
    window.history.replaceState(null,'',window.location.pathname+window.location.search);
    setReady(true);
  },[]);
  if(!/^[0-9a-f-]{36}$/i.test(applicationId)) return <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mr-2 inline h-4 w-4"/>Application reference is invalid.</div>;
  if(!ready) return <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin"/>Checking secure upload link...</div>;
  if(!/^[A-Fa-f0-9]{64}$/.test(token)) return <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">The private upload token is missing or invalid. Reopen the original email link. If it has expired, contact SahiTech Education.</div>;
  return <div className="mt-6"><ApplicationDocumentUpload applicationId={applicationId} uploadToken={token}/></div>;
}
