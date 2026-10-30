// The translation function for screens: re-renders the component when the person switches language.
import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { translate, type Vars } from './index';

export function useT() {
  const lang = useStore((s) => s.language);
  return useCallback((text: string, vars?: Vars) => translate(lang, text, vars), [lang]);
}

/** The current language, for values the server sends in all three (see pick() in i18n/index.ts). */
export function useLang() {
  return useStore((s) => s.language);
}
