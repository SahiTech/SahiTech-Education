'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Loader2,
  UploadCloud,
  XCircle,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  FilePlus2,
  Trash2
} from 'lucide-react';

type UploadItem = { name: string; type: string; size: number; file: File };

const SUGGESTED_DOCS = [
  { id: 'registration', title: 'মাদরাসার নিবন্ধন সনদ / গেজেট', desc: 'সরকারি বা বোর্ড নিবন্ধন কপি' },
  { id: 'board_affiliation', title: 'বোর্ড প্রত্যয়ন বা অধিভুক্তি পত্র', desc: 'বেফাক, হাইআ বা BMEB সনদ' },
  { id: 'authorization', title: 'মাদরাসার প্যাডে আবেদনপত্র', desc: 'মুহতামিমের সিল ও স্বাক্ষর সম্বলিত লেটারহেড' },
  { id: 'identity', title: 'দায়িত্বশীলের জাতীয় পরিচয়পত্র / পাসপোর্ট', desc: 'মুহতামিম বা সভাপতির NID/Passport' },
  { id: 'other', title: 'কমিটি রেজুলেশন বা অন্যান্য প্রমাণক', desc: 'কার্যনির্বাহী কমিটির রেজুলেশন' }
];

export function ApplicationDocumentUpload({
  applicationId,
  uploadToken
}: {
  applicationId: string;
  uploadToken: string;
}) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [documentType, setDocumentType] = useState('registration');

  function addFiles(files: FileList | null) {
    if (!files) return;
    setError('');
    const next = Array.from(files).map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      file
    }));

    const invalid = next.find(
      x =>
        !['application/pdf', 'image/jpeg', 'image/png'].includes(x.type) ||
        x.size > 10 * 1024 * 1024 ||
        x.size === 0
    );

    if (invalid) {
      setError('শুধু PDF, JPG বা PNG ফাইল (সর্বোচ্চ ১০ MB প্রতি ফাইল) আপলোড করা যাবে।');
      return;
    }
    setItems(current => [...current, ...next].slice(0, 10));
  }

  async function uploadAll() {
    if (!items.length || busy) return;
    setBusy(true);
    setError('');

    try {
      const supabase = createClient();
      for (const item of items) {
        const safeName =
          item.name
            .normalize('NFKD')
            .replace(/[^a-zA-Z0-9._-]+/g, '-')
            .slice(-100) || 'document';
        const path = `${applicationId}/${uploadToken}/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('madrasa-application-documents')
          .upload(path, item.file, {
            upsert: false,
            contentType: item.type,
            cacheControl: '3600'
          });

        if (uploadError) throw new Error(`আপলোড ব্যর্থ হয়েছে (${item.name}): ${uploadError.message}`);

        const { error: recordError } = await (supabase.rpc as any)(
          'register_madrasa_application_document',
          {
            p_application_id: applicationId,
            p_token: uploadToken,
            p_path: path,
            p_document_type: documentType,
            p_original_file_name: item.name,
            p_mime_type: item.type,
            p_file_size_bytes: item.size
          }
        );

        if (recordError) {
          throw new Error(
            `ফাইল আপলোড হয়েছে তবে মেটাডাটা সংরক্ষণ করা যায়নি (${item.name})। অনুগ্রহ করে হেল্পলাইনে যোগাযোগ করুন।`
          );
        }

        setDone(current => [...current, item.name]);
        setItems(current => current.filter(existing => existing !== item));
      }
      setItems([]);
    } catch (err: any) {
      setError(err.message || 'ডকুমেন্ট আপলোড করার সময় সমস্যা হয়েছে।');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      {/* Guidance Cards for Teachers */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-800">
          প্রয়োজনীয় কাগজপত্রের ধরন নির্বাচন করুন
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SUGGESTED_DOCS.map(doc => (
            <button
              key={doc.id}
              type="button"
              onClick={() => setDocumentType(doc.id)}
              className={`flex items-start gap-3 rounded-xl p-3 border text-left transition ${
                documentType === doc.id
                  ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  documentType === doc.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  {doc.title}
                </span>
                <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {doc.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Dropzone */}
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/60 transition group">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 group-hover:scale-105 transition-transform shadow-xs">
          <UploadCloud className="h-7 w-7" />
        </div>
        <span className="mt-3 text-sm font-bold text-slate-900">
          ফাইল নির্বাচন করুন বা এখানে টেনে এনে ছাড়ুন
        </span>
        <span className="mt-1 text-xs text-slate-500">
          PDF, JPG বা PNG নথি · প্রতি ফাইল সর্বোচ্চ ১০ MB (মোট ১০টি ফাইল পর্যন্ত)
        </span>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          multiple
          className="sr-only"
          onChange={e => addFiles(e.target.files)}
        />
      </label>

      {/* Selected Files List */}
      {items.length > 0 && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-200/60">
            <span>আপলোডের জন্য প্রস্তুত ফাইল ({items.length})</span>
            <span className="text-[11px] text-slate-500">ক্যাটাগরি: {documentType}</span>
          </div>
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg bg-white p-2.5 border border-slate-200 shadow-2xs text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">{item.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({(item.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setItems(current => current.filter((_, idx) => idx !== i))}
                disabled={busy}
                className="text-slate-400 hover:text-red-600 transition p-1"
                aria-label="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Success Notification */}
      {done.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
          <span>
            আলহামদুলিল্লাহ! আপনার <b>{done.length}টি</b> ফাইল সফলভাবে নিরাপদে আপলোড করা হয়েছে।
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center gap-2"
        >
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        onClick={uploadAll}
        disabled={busy || items.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-800/20 disabled:opacity-50 transition min-h-[48px]"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>নিরাপদ ক্লাউডে আপলোড হচ্ছে...</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4" />
            <span>নির্বাচিত ফাইলগুলো নিরাপদে আপলোড করুন</span>
          </>
        )}
      </button>

      {/* Privacy Guarantee Note */}
      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          আপনার আপলোডকৃত সকল নথি প্রাইভেট সুরক্ষিত স্টোরেজে সংরক্ষিত থাকে এবং শুধুমাত্র যাচাইয়ের জন্য ব্যবহৃত হয়।
        </span>
      </div>
    </section>
  );
}
