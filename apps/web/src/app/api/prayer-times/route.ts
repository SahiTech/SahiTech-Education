import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const CITIES = new Set([
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Sylhet',
  'Khulna',
  'Barisal',
  'Rangpur',
  'Mymensingh',
]);

function dhakaDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function toApiDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

async function getTimings(city: string, date: string) {
  const url = new URL(`https://api.aladhan.com/v1/timingsByCity/${toApiDate(date)}`);
  url.searchParams.set('city', city);
  url.searchParams.set('country', 'Bangladesh');
  url.searchParams.set('method', '1');
  url.searchParams.set('school', '1');
  url.searchParams.set('timezonestring', 'Asia/Dhaka');

  const response = await fetch(url, {
    next: { revalidate: 3600 },
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error('prayer_provider_unavailable');

  const payload = await response.json();
  const timings = payload?.data?.timings;
  const isoDate = payload?.data?.date?.gregorian?.isoDate;
  if (!timings || typeof isoDate !== 'string') throw new Error('prayer_data_invalid');

  const keys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
  const clean: Record<string, string> = {};
  for (const key of keys) {
    const value = String(timings[key] || '').match(/^(\d{1,2}:\d{2})/);
    if (!value) throw new Error('prayer_timing_invalid');
    clean[key] = value[1];
  }

  return { date: isoDate, timings: clean };
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city') || 'Dhaka';
  if (!CITIES.has(city)) {
    return NextResponse.json({ error: 'unsupported_city' }, { status: 400 });
  }

  try {
    const today = dhakaDate(new Date());
    const tomorrow = dhakaDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [todayData, tomorrowData] = await Promise.all([
      getTimings(city, today),
      getTimings(city, tomorrow),
    ]);

    return NextResponse.json(
      { city, timeZone: 'Asia/Dhaka', method: 1, school: 1, today: todayData, tomorrow: tomorrowData },
      { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } },
    );
  } catch {
    return NextResponse.json({ error: 'prayer_times_unavailable' }, { status: 502 });
  }
}
