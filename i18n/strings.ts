// Hindi and Punjabi for every English text the app shows, keyed by the English exactly as written in t('…').
// i18n.test.ts fails when a t('…') in the code has no entry here, an entry is missing a language or a {value}, or an
// entry is no longer used. The entries live in strings/, one file per part of the app; a text used in several places
// is written once.
import { common } from './strings/common';
import { components } from './strings/components';
import { errors } from './strings/errors';
import { forms } from './strings/forms';
import { job } from './strings/job';
import { jobs } from './strings/jobs';
import { legal } from './strings/legal';
import { start } from './strings/start';
import { tabs } from './strings/tabs';
import { utils } from './strings/utils';

export const STRINGS: Record<string, { hi: string; pa: string }> = {
  ...common,
  ...components,
  ...job,
  ...jobs,
  ...legal,
  ...errors,
  ...forms,
  ...start,
  ...tabs,
  ...utils,
};
