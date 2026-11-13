'use client';

import React, { useActionState } from 'react';
import { submitMadrasaApplication, type ApplicationResult } from '@/app/actions/applications';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { ApplicationDocumentUpload } from './document-upload';

const initialState: ApplicationResult = { success: false };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(submitMadrasaApplication, initialState);
  if(state.success && state.applicationId && state.uploadToken){
    return <div className="space-y-5">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <CheckCircle2 className="h-8 w-8 text-emerald-700"/>
        <h2 className="mt-2 text-lg font-black text-emerald-900">আবেদন গ্রহণ করা হয়েছে</h2>
        <p className="mt-1 text-sm leading-6 text-emerald-800">আপনার আবেদন নম্বর: <b>{state.applicationId}</b>। এখন প্রযোজ্য প্রতিষ্ঠানের কাগজপত্র আপলোড করুন।</p>
      </div>
      <ApplicationDocumentUpload applicationId={state.applicationId} uploadToken={state.uploadToken}/>
      <p className="text-xs leading-5 text-slate-500">এই আপলোড লিংকটি সাত দিনের জন্য বৈধ। টোকেনটি শুধু এই ব্রাউজার সেশনে ব্যবহার করুন; অন্য কারও সঙ্গে শেয়ার করবেন না।</p>
    </div>;
  }
  return (
    <form action={formAction} className="space-y-5">
      {state.error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{state.error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="institutionName" label="মাদরাসার অফিসিয়াল নাম *" required placeholder="Jamia Islamia..." />
        <Field name="institutionNameBn" label="মাদরাসার নাম (বাংলা)" placeholder="জামিয়া ইসলামিয়া..." />
        <SelectField name="institutionType" label="মাদরাসার ধরন *" required options={[['qawmi','কওমি (Qawmi)'],['alia','আলিয়া (Alia)'],['hybrid','সমন্বিত (Hybrid)']]} />
        <Field name="boardAffiliation" label="বোর্ড / অধিভুক্তি" placeholder="বেফাক / BMEB / অন্যান্য" />
        <Field name="registrationNumber" label="নিবন্ধন নম্বর" />
        <Field name="establishedYear" label="প্রতিষ্ঠার সাল" type="number" />
        <Field name="requestedCode" label="প্রস্তাবিত প্রতিষ্ঠান কোড *" required placeholder="JAMIA-01" />
        <Field name="requestedSubdomain" label="প্রস্তাবিত সাবডোমেইন *" required placeholder="jamia-islamia" suffix=".sahitech-edu.com" />
        <Field name="contactPersonName" label="যোগাযোগের দায়িত্বপ্রাপ্ত ব্যক্তি *" required />
        <Field name="contactEmail" label="অফিসিয়াল ইমেইল *" type="email" required />
        <Field name="contactPhone" label="মোবাইল নম্বর *" required />
        <Field name="division" label="বিভাগ" />
        <Field name="district" label="জেলা" />
        <Field name="websiteUrl" label="ওয়েবসাইট" type="url" />
      </div>
      <Field name="address" label="পূর্ণ ঠিকানা" />
      <div><label className="mb-1 block text-xs font-bold text-slate-700">আবেদন সম্পর্কে অতিরিক্ত তথ্য</label><textarea name="applicationNote" rows={4} maxLength={1500} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none" /></div>
      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><label>Company website<input name="companyWebsite" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">আবেদন জমা দিলেই মাদরাসার tenant তৈরি বা account সক্রিয় হবে না। Global Platform Owner-এর document verification ও approval-এর পর invitation পাঠানো হবে।</div>
      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" />আবেদন জমা হচ্ছে...</> : <>মাদরাসার আবেদন জমা দিন <ArrowRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}
function Field({name,label,type='text',required=false,placeholder='',suffix}:{name:string;label:string;type?:string;required?:boolean;placeholder?:string;suffix?:string}) {
  return <div><label htmlFor={name} className="mb-1 block text-xs font-bold text-slate-700">{label}</label><div className="flex overflow-hidden rounded-lg border border-slate-300 focus-within:border-emerald-600"><input id={name} name={name} type={type} required={required} placeholder={placeholder} maxLength={500} className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none" />{suffix && <span className="flex items-center border-l bg-slate-50 px-2 text-[11px] text-slate-500">{suffix}</span>}</div></div>;
}
function SelectField({name,label,required,options}:{name:string;label:string;required?:boolean;options:[string,string][]}) {
  return <div><label htmlFor={name} className="mb-1 block text-xs font-bold text-slate-700">{label}</label><select id={name} name={name} required={required} defaultValue="qawmi" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">{options.map(([value,text])=><option key={value} value={value}>{text}</option>)}</select></div>;
}
