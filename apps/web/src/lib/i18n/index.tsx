'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Locale, Direction, Translations } from './types';
import { bn } from './dictionaries/bn';
import { en } from './dictionaries/en';
import { ar } from './dictionaries/ar';

const dictionaries: Record<Locale, Translations> = {
  bn,
  en,
  ar,
};

export function getDictionary(locale: Locale): Translations {
  return dictionaries[locale] || dictionaries.bn;
}

export function getDirection(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

interface I18nContextType {
  locale: Locale;
  direction: Direction;
  t: Translations;
  setLocale: (newLocale: Locale) => void;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'bn',
  direction: 'ltr',
  t: bn,
  setLocale: () => {},
});

export function I18nProvider({
  children,
  initialLocale = 'bn',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  const direction = getDirection(locale);
  const t = getDictionary(locale);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocaleState(newLocale);

    // Persist in cookie for 1 year
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    
    // Update document properties immediately
    document.documentElement.lang = newLocale;
    document.documentElement.dir = getDirection(newLocale);

    router.refresh();
  };

  useEffect(() => {
    // Read cookie on mount if available
    const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
    if (match && match[1] && (match[1] === 'bn' || match[1] === 'en' || match[1] === 'ar')) {
      const savedLocale = match[1] as Locale;
      if (savedLocale !== locale) {
        setLocaleState(savedLocale);
        document.documentElement.lang = savedLocale;
        document.documentElement.dir = getDirection(savedLocale);
      }
    }
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, direction, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

