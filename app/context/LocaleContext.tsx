'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import uzMessages from '@/messages/uz.json';
import ruMessages from '@/messages/ru.json';
import enMessages from '@/messages/en.json';

const COOKIE_NAME = 'NEXT_LOCALE';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

export type Locale = 'uz' | 'ru' | 'en';

const DEFAULT_LOCALE: Locale = 'uz';
const SUPPORTED_LOCALES: Locale[] = ['uz', 'ru', 'en'];

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  uz: uzMessages as Record<string, unknown>,
  ru: ruMessages as Record<string, unknown>,
  en: enMessages as Record<string, unknown>,
};

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function useLocale(): LocaleContextType {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useTranslation(): (key: string) => string {
  return useLocale().t;
}

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getCookie(COOKIE_NAME);
    const initial: Locale = SUPPORTED_LOCALES.includes(stored as Locale) ? (stored as Locale) : DEFAULT_LOCALE;
    setLocaleState(initial);
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;
    setLocaleState(newLocale);
    setCookie(COOKIE_NAME, newLocale, COOKIE_MAX_AGE);
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      const messages = MESSAGES[locale];
      const v = getNested(messages, key);
      return typeof v === 'string' ? v : key;
    },
    [locale]
  );

  useEffect(() => {
    if (!mounted || typeof document === 'undefined' || !document.documentElement) return;
    document.documentElement.lang = locale;
  }, [locale, mounted]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
