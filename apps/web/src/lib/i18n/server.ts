import { cookies } from 'next/headers';
import { Locale, Direction, Translations } from './types';
import { bn } from './dictionaries/bn';
import { en } from './dictionaries/en';
import { ar } from './dictionaries/ar';

const dictionaries: Record<Locale, Translations> = {
  bn,
  en,
  ar,
};

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const val = cookieStore.get('NEXT_LOCALE')?.value;
  if (val === 'en' || val === 'ar' || val === 'bn') {
    return val;
  }
  return 'bn';
}

export async function getServerDictionary(): Promise<Translations> {
  const locale = await getServerLocale();
  return dictionaries[locale] || dictionaries.bn;
}

export async function getServerDirection(): Promise<Direction> {
  const locale = await getServerLocale();
  return locale === 'ar' ? 'rtl' : 'ltr';
}

