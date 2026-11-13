'use client';

import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';

const TYPES=[['registration','Registration certificate'],['board_affiliation','Board affiliation'],['identity','Authorized representative identity'],['authorization','Authorization letter'],['other','Other supporting document']];

export default function ApplicationDocumentUploader({applicationId,uploadToken}:{applicationId:string;uploadToken:string}){
  const [type,setType]=useState('registration');
  const [files,setFiles]=useState<string[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState('');

  async function upload(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setError('');setSuccess('');
    const form=e.currentTarget;
    const input=form.elements.namedItem('document') as HTMLInputElement;
    const file=input.files?.[0];
    if(!file){setError('Choose a document first.');setBusy(false);return;}
    if(file.size<=0||file.size>10*1024*1024){setError('File size must be between 1 byte and 10 MB.');setBusy(false);return;}
    if(!['application/pdf','image/jpeg','image/png'].includes(file.type)){setError('Only PDF, JPEG and PNG files are accepted.');setBusy(false);return;}
    try{
      const supabase=createClient();
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-120);
      const path=`${applicationId}/${uploadToken}/${crypto.randomUUID()}-${safeName}`;
      const {error:uploadError}=await supabase.storage.from('madrasa-application-documents').upload(path,file,{contentType:file.type,upsert:false});
      if(uploadError) throw new Error('Secure upload failed. The application upload link may have expired.');
      const {error:registerError}=await (supabase.rpc as any)('register_madrasa_application_document',{
        p_application_id:applicationId,
        p_token:uploadToken,
        p_path:path,
        p_document_type:type,
        p_original_file_name:file.name,
        p_mime_type:file.type,
        p_file_size_bytes:file.size
      });
      if(registerError) {
        await supabase.storage.from('madrasa-application-documents').remove([path]);
        throw new Error('The file could not be registered, so the temporary upload was removed. Please try again.');
      }
      setFiles(prev=>[...prev,file.name]);
      setSuccess('Document uploaded securely.');
      input.value='';
    }catch(err:any){setError(err.message||'Upload failed.');}
    finally{setBusy(false);}
  }

  return <section className="mt-7 space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
    <div><h2 className="font-bold text-slate-900">Supporting documents (optional but recommended)</h2><p className="mt-1 text-xs leading-5 text-slate-600">Upload registration, board affiliation or authorization documents. Files are stored in a private bucket and can only be reviewed by the Global Platform Owner. PDF, JPEG and PNG · Maximum 10 MB per file · Up to 10 uploads.</p></div>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
    {success&&<p role="status" className="rounded-lg bg-emerald-100 p-2 text-xs text-emerald-800">{success}</p>}
    {files.length>0&&<ul className="list-disc pl-5 text-xs text-slate-700">{files.map((file,i)=><li key={i}>{file}</li>)}</ul>}
    <form onSubmit={upload} className="space-y-3">
      <div><label className="mb-1 block text-xs font-bold text-slate-700">Document type</label><select value={type} onChange={e=>setType(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">{TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
      <input name="document" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold"/>
      <button disabled={busy||files.length>=10} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy?'Uploading securely...':'Upload document'}</button>
    </form>
  </section>
}
