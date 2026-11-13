'use client';

import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import {FileText, Loader2, UploadCloud, XCircle, CheckCircle2} from 'lucide-react';

type UploadItem={name:string;type:string;size:number;file:File};

export function ApplicationDocumentUpload({applicationId,uploadToken}:{applicationId:string;uploadToken:string}){
  const [items,setItems]=useState<UploadItem[]>([]);
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState<string[]>([]);
  const [error,setError]=useState('');
  const [documentType,setDocumentType]=useState('registration');

  function addFiles(files:FileList|null){
    if(!files)return;
    setError('');
    const next=Array.from(files).map(file=>({name:file.name,type:file.type,size:file.size,file}));
    const invalid=next.find(x=>!['application/pdf','image/jpeg','image/png'].includes(x.type)||x.size>10*1024*1024||x.size===0);
    if(invalid){setError('শুধু PDF, JPG বা PNG ফাইল (সর্বোচ্চ ১০ MB) আপলোড করা যাবে।');return;}
    setItems(current=>[...current,...next].slice(0,10));
  }

  async function uploadAll(){
    if(!items.length||busy)return;
    setBusy(true);setError('');
    try{
      const supabase=createClient();
      for(const item of items){
        const safeName=item.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').slice(-100)||'document';
        const path=`${applicationId}/${uploadToken}/${crypto.randomUUID()}-${safeName}`;
        const {error:uploadError}=await supabase.storage.from('madrasa-application-documents').upload(path,item.file,{upsert:false,contentType:item.type,cacheControl:'3600'});
        if(uploadError)throw new Error(`Upload failed for ${item.name}. ${uploadError.message}`);
        const {error:recordError}=await (supabase.rpc as any)('register_madrasa_application_document',{
          p_application_id:applicationId,
          p_token:uploadToken,
          p_path:path,
          p_document_type:documentType,
          p_original_file_name:item.name,
          p_mime_type:item.type,
          p_file_size_bytes:item.size,
        });
        if(recordError)throw new Error(`File uploaded but its record could not be saved: ${item.name}. Contact support before retrying.`);
        setDone(current=>[...current,item.name]);
      }
      setItems([]);
    }catch(err:any){setError(err.message||'Document upload failed.');}
    finally{setBusy(false);}
  }

  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
    <div><h3 className="font-bold text-slate-900">প্রতিষ্ঠানের প্রয়োজনীয় কাগজপত্র</h3><p className="mt-1 text-xs leading-5 text-slate-500">নিবন্ধন সনদ, বোর্ড affiliation, অনুমোদনপত্র বা দায়িত্বপ্রাপ্ত ব্যক্তির পরিচয়পত্রের মতো প্রাসঙ্গিক নথি দিন। ফাইলগুলো private storage-এ থাকবে এবং শুধু Global Owner review করতে পারবেন।</p></div>
    <div><label className="mb-1 block text-xs font-bold text-slate-700">Document category</label><select value={documentType} onChange={e=>setDocumentType(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="registration">Institution registration certificate</option><option value="board_affiliation">Board affiliation / recognition</option><option value="identity">Authorized representative identity</option><option value="authorization">Authorization letter</option><option value="other">Other supporting document</option></select></div>
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-emerald-500">
      <UploadCloud className="h-8 w-8 text-emerald-700"/><span className="mt-2 text-sm font-bold text-slate-800">ফাইল নির্বাচন করুন</span><span className="mt-1 text-xs text-slate-500">PDF, JPG, PNG · সর্বোচ্চ ১০ MB প্রতিটি</span>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" multiple className="sr-only" onChange={e=>addFiles(e.target.files)}/>
    </label>
    {items.length>0&&<div className="space-y-2">{items.map((item,i)=><div key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs"><FileText className="h-4 w-4 text-slate-500"/><span className="min-w-0 flex-1 truncate">{item.name}</span><span className="text-slate-400">{(item.size/1024/1024).toFixed(1)} MB</span><button type="button" onClick={()=>setItems(current=>current.filter((_,index)=>index!==i))} disabled={busy} aria-label="Remove file"><XCircle className="h-4 w-4 text-slate-400"/></button></div>)}</div>}
    {done.length>0&&<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="mr-1 inline h-4 w-4"/>{done.length}টি ফাইল নিরাপদে আপলোড হয়েছে।</div>}
    {error&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
    <button type="button" onClick={uploadAll} disabled={busy||items.length===0} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?<><Loader2 className="h-4 w-4 animate-spin"/>আপলোড হচ্ছে...</>:<>নির্বাচিত কাগজপত্র আপলোড করুন</>}</button>
  </section>
}
