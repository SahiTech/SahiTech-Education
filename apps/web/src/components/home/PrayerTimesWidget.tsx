'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock3, MapPin, RefreshCw } from 'lucide-react';

type Timings = Record<'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha', string>;
type PrayerDay = { date: string; timings: Timings };
type PrayerResponse = {
  city: string;
  timeZone: 'Asia/Dhaka';
  today: PrayerDay;
  tomorrow: PrayerDay;
};

type Labels = {
  title: string;
  description: string;
  locationLabel: string;
  nextLabel: string;
  loading: string;
  error: string;
  retry: string;
  sourceNote: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
};

const CITY_NAMES = {
  Dhaka: { bn: 'ঢাকা', en: 'Dhaka', ar: 'دكا' },
  Chittagong: { bn: 'চট্টগ্রাম', en: 'Chattogram', ar: 'تشيتاغونغ' },
  Rajshahi: { bn: 'রাজশাহী', en: 'Rajshahi', ar: 'راجشاهي' },
  Sylhet: { bn: 'সিলেট', en: 'Sylhet', ar: 'سيلهيت' },
  Khulna: { bn: 'খুলনা', en: 'Khulna', ar: 'خولنا' },
  Barisal: { bn: 'বরিশাল', en: 'Barishal', ar: 'باريشال' },
  Rangpur: { bn: 'রংপুর', en: 'Rangpur', ar: 'رانغبور' },
  Mymensingh: { bn: 'ময়মনসিংহ', en: 'Mymensingh', ar: 'ميمينسينغ' },
} as const;

const CITY_LIST = Object.keys(CITY_NAMES) as Array<keyof typeof CITY_NAMES>;

function prayerDateTime(isoDate: string, time: string) {
  return new Date(`${isoDate}T${time}:00+06:00`);
}

function formatClock(isoDate: string, time: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Dhaka',
    hour: 'numeric',
    minute: '2-digit',
  }).format(prayerDateTime(isoDate, time));
}

function formatRemaining(milliseconds: number, locale: string) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const number = (value: number) => new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false }).format(value);
  return `${number(hours)}:${number(minutes)}:${number(seconds)}`;
}

export function PrayerTimesWidget({ locale, labels }: { locale: 'bn' | 'en' | 'ar'; labels: Labels }) {
  const [city, setCity] = useState<keyof typeof CITY_NAMES>('Dhaka');
  const [data, setData] = useState<PrayerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(Date.now());

  async function load() {
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(`/api/prayer-times?city=${encodeURIComponent(city)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('prayer_times_unavailable');
      const result = (await response.json()) as PrayerResponse;
      setData(result);
    } catch {
      setFailed(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [city]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const prayers = useMemo(() => {
    if (!data) return [];
    return [
      { key: 'Fajr', label: labels.fajr, time: data.today.timings.Fajr, date: data.today.date },
      { key: 'Dhuhr', label: labels.dhuhr, time: data.today.timings.Dhuhr, date: data.today.date },
      { key: 'Asr', label: labels.asr, time: data.today.timings.Asr, date: data.today.date },
      { key: 'Maghrib', label: labels.maghrib, time: data.today.timings.Maghrib, date: data.today.date },
      { key: 'Isha', label: labels.isha, time: data.today.timings.Isha, date: data.today.date },
    ];
  }, [data, labels]);

  const nextPrayer = useMemo(() => {
    if (!data) return null;
    const candidates = prayers.map((prayer) => ({ ...prayer, at: prayerDateTime(prayer.date, prayer.time) }));
    const nextToday = candidates.find((prayer) => prayer.at.getTime() > now);
    if (nextToday) return nextToday;
    return {
      key: 'Fajr',
      label: labels.fajr,
      time: data.tomorrow.timings.Fajr,
      date: data.tomorrow.date,
      at: prayerDateTime(data.tomorrow.date, data.tomorrow.timings.Fajr),
    };
  }, [data, labels.fajr, now, prayers]);

  const cityLabel = CITY_NAMES[city][locale];

  return (
    <section aria-label={labels.title} className="overflow-hidden rounded-[26px] border border-[#DCD3C1] bg-white shadow-[0_12px_36px_rgba(22,46,35,0.07)]">
      <div className="relative overflow-hidden bg-[#123D32] px-6 py-6 text-white sm:px-7">
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "url('/images/islamic-pattern.jpg')", backgroundSize: '280px 280px' }} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#D8BD86]">
              <Clock3 className="h-4 w-4" />
              {labels.title}
            </div>
            <p className="mt-2 text-sm leading-6 text-white/75">{labels.description}</p>
          </div>
          <label className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white">
            <MapPin className="h-4 w-4 text-[#D8BD86]" />
            <span className="sr-only">{labels.locationLabel}</span>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value as keyof typeof CITY_NAMES)}
              className="max-w-[145px] bg-transparent font-semibold text-white outline-none [&>option]:text-[#202B27]"
            >
              {CITY_LIST.map((item) => <option key={item} value={item}>{CITY_NAMES[item][locale]}</option>)}
            </select>
          </label>
        </div>

        {nextPrayer && (
          <div className="relative mt-6 rounded-2xl border border-white/15 bg-white/[0.08] p-4 sm:p-5">
            <p className="text-xs font-semibold text-[#E7D5B2]">{labels.nextLabel}</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xl font-bold">{nextPrayer.label}</p>
                <p className="mt-1 text-sm text-white/70">{formatClock(nextPrayer.date, nextPrayer.time, locale)}</p>
              </div>
              <p className="font-mono text-2xl font-semibold tracking-wider text-[#F0D9A6] tabular-nums sm:text-3xl" aria-live="off">
                {formatRemaining(nextPrayer.at.getTime() - now, locale)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {loading ? (
          <div className="flex min-h-28 items-center justify-center text-sm text-[#69736E]" role="status">{labels.loading}</div>
        ) : failed || !data ? (
          <div className="flex min-h-28 flex-col items-center justify-center gap-3 text-center">
            <p role="alert" className="text-sm text-[#69736E]">{labels.error}</p>
            <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-[#DCD3C1] px-4 py-2 text-xs font-bold text-[#17372D] hover:bg-[#F7F4EC]">
              <RefreshCw className="h-3.5 w-3.5" />
              {labels.retry}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { key: 'Fajr', label: labels.fajr, time: data.today.timings.Fajr },
              { key: 'Sunrise', label: labels.sunrise, time: data.today.timings.Sunrise },
              { key: 'Dhuhr', label: labels.dhuhr, time: data.today.timings.Dhuhr },
              { key: 'Asr', label: labels.asr, time: data.today.timings.Asr },
              { key: 'Maghrib', label: labels.maghrib, time: data.today.timings.Maghrib },
              { key: 'Isha', label: labels.isha, time: data.today.timings.Isha },
            ].map((prayer) => {
              const active = nextPrayer?.key === prayer.key;
              return (
                <div key={prayer.key} className={`rounded-xl border px-3 py-3 ${active ? 'border-[#B89455]/70 bg-[#F4EEDD]' : 'border-[#EEE8DA] bg-[#FBFAF6]'}`}>
                  <p className="text-xs font-semibold text-[#69736E]">{prayer.label}</p>
                  <p className={`mt-1 text-base font-bold tabular-nums ${active ? 'text-[#795C2F]' : 'text-[#17372D]'}`}>
                    {formatClock(data.today.date, prayer.time, locale)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-4 border-t border-[#EEE8DA] pt-3 text-[11px] leading-5 text-[#7B857E]">{labels.sourceNote}</p>
      </div>
      <span className="sr-only">{cityLabel}</span>
    </section>
  );
}
