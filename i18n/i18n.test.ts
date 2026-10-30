/// <reference types="node" />
// Reads the source files to check every on-screen text has its Hindi and Punjabi (Node types only for this test).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STRINGS } from './strings';
import { pick, translate } from './index';

const ROOT = join(__dirname, '..');
const SOURCE_DIRS = ['app', 'components', 'utils', 'api', 'store', 'constants'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

const files = SOURCE_DIRS.flatMap((d) => sourceFiles(join(ROOT, d)));
const sources = files.map((path) => ({ path: relative(ROOT, path).replace(/\\/g, '/'), text: readFileSync(path, 'utf8') }));

/** Every t('…') / t("…") key in the code. A key must be a plain literal so it can be found here. */
const CALL = /(?<![\w.$])t\(\s*(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g;
function unescape(raw: string): string {
  return raw.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n');
}
const used = new Map<string, string>(); // key -> first file using it
for (const { path, text } of sources) {
  for (const m of text.matchAll(CALL)) {
    const key = unescape(m[2]);
    if (!used.has(key)) used.set(key, path);
  }
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

// Screens where showing every language at once is the point: the language picker and the EN/हिं/ਪੰ switch
const MAY_MIX_SCRIPTS = new Set(['app/language.tsx', 'components/LanguageToggle.tsx']);

describe('translations', () => {
  it('finds the texts (so the test cannot pass by finding nothing)', () => {
    expect(used.size).toBeGreaterThan(900);
  });

  it('only ever calls the translator t, so this test can see every key', () => {
    const otherNames = sources.flatMap(({ path, text }) =>
      [...text.matchAll(/const (\w+) = useT\(\)/g)].filter((m) => m[1] !== 't').map((m) => `${path}: ${m[1]}`),
    );
    expect(otherNames).toEqual([]);
  });

  it('writes each text once across the strings files (a second entry would silently win)', () => {
    const dir = join(__dirname, 'strings');
    const seen = new Map<string, string>();
    const twice: string[] = [];
    for (const file of readdirSync(dir)) {
      const text = readFileSync(join(dir, file), 'utf8');
      for (const m of text.matchAll(/^ {2}(?:(['"])((?:\\.|(?!\1).)*)\1|([A-Za-z]+)): \{/gm)) {
        const key = m[2] !== undefined ? unescape(m[2]) : m[3];
        if (seen.has(key)) twice.push(`${key} (${seen.get(key)} and ${file})`);
        else seen.set(key, file);
      }
    }
    expect(seen.size).toBe(Object.keys(STRINGS).length);
    expect(twice).toEqual([]);
  });

  it('has Hindi and Punjabi for every text the code shows', () => {
    const missing = [...used].filter(([key]) => !STRINGS[key]?.hi || !STRINGS[key]?.pa).map(([key, file]) => `${file}: ${key}`);
    expect(missing).toEqual([]);
  });

  it('keeps the same {values} in every language', () => {
    const wrong = Object.entries(STRINGS)
      .filter(([en, tr]) => placeholders(en).join() !== placeholders(tr.hi).join() || placeholders(en).join() !== placeholders(tr.pa).join())
      .map(([en]) => en);
    expect(wrong).toEqual([]);
  });

  it('has no leftover translations that nothing uses', () => {
    expect(Object.keys(STRINGS).filter((key) => !used.has(key))).toEqual([]);
  });

  it('shows one language at a time: no Hindi or Punjabi written into a screen', () => {
    const indic = /[\u0900-\u097F\u0A00-\u0A7F]/;
    const offenders = sources
      .filter(({ path }) => !MAY_MIX_SCRIPTS.has(path))
      .flatMap(({ path, text }) =>
        text
          .split('\n')
          .map((line, i) => ({ line: line.trim(), i }))
          .filter(({ line }) => indic.test(line) && !line.startsWith('//') && !line.startsWith('*'))
          .map(({ line, i }) => `${path}:${i + 1}: ${line.slice(0, 80)}`),
      );
    expect(offenders).toEqual([]);
  });

  it('fills values and falls back to English', () => {
    expect(translate('en', '{count} Offers', { count: 3 })).toBe('3 Offers');
    expect(translate('hi', 'A text nobody translated')).toBe('A text nobody translated');
    expect(pick({ en: 'Plumber', hi: 'प्लंबर', pa: '' }, 'pa')).toBe('Plumber');
    expect(pick({ en: 'Plumber', hi: 'प्लंबर', pa: 'ਪਲੰਬਰ' }, 'hi')).toBe('प्लंबर');
  });
});
