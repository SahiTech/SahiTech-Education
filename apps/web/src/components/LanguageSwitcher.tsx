'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Locale } from '@/lib/i18n/types';

const options: Array<{ code: Locale; short: string; name: string; native: string }> = [
  { code: 'bn', short: 'BN', name: 'Bangla', native: 'বাংলা' },
  { code: 'en', short: 'EN', name: 'English', native: 'English' },
  { code: 'ar', short: 'AR', name: 'Arabic', native: 'العربية' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.code === locale) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Change language"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e5dfd2] bg-white px-2.5 text-[11px] font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
      >
        <Globe className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
        <span className="min-w-[1.4rem] text-center">{current.short}</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choose language"
          className="absolute right-0 top-full z-[70] mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5"
        >
          {options.map((option) => {
            const selected = option.code === locale;
            return (
              <button
                key={option.code}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setLocale(option.code);
                  setOpen(false);
                }}
                className={`flex min-h-10 w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${selected ? 'bg-emerald-50 font-bold text-emerald-900' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <span className="flex flex-col items-start leading-tight">
                  <span>{option.name}</span>
                  <span className="mt-0.5 text-[10px] font-normal text-slate-400">{option.native}</span>
                </span>
                {selected && <Check className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
