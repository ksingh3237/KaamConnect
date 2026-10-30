// The app's words in the language the person chose (English, Hindi or Punjabi): one language on screen, never two side by side.
//
// The English text is the key: t('Accept Offer') returns it as is in English and looks it up in strings.ts for Hindi and
// Punjabi. Values go in braces: t('{count} Offers', { count: 3 }). Keys must be plain string literals (not templates or
// variables) so i18n.test.ts can find every one of them and fail when a translation is missing.
//
// No React and no store in here, so plain modules (dialogs, error texts) and unit tests can use it. Screens use useT()
// (i18n/useT.ts), which re-renders them when the language changes.
import { STRINGS } from './strings';

export type Lang = 'en' | 'hi' | 'pa';
export type Vars = Record<string, string | number>;

let current: Lang = 'en';

/** Called by the store whenever the language changes; everything read through t() follows it. */
export function setCurrentLanguage(lang: Lang): void {
  current = lang;
}

export function currentLanguage(): Lang {
  return current;
}

function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** `text` (the English) in `lang`. A missing translation shows the English rather than nothing. */
export function translate(lang: Lang, text: string, vars?: Vars): string {
  const entry = lang === 'en' ? undefined : STRINGS[text]?.[lang];
  return fill(entry ?? text, vars);
}

/** For code outside React components (dialogs, error texts). Components use useT() so they re-render on a change. */
export function t(text: string, vars?: Vars): string {
  return translate(current, text, vars);
}

/** A value the server sends in all three languages (service names), in the current one. */
export function pick(texts: { en: string; hi?: string | null; pa?: string | null }, lang: Lang = current): string {
  return (lang === 'en' ? texts.en : texts[lang]) || texts.en;
}
