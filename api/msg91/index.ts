import { MSG91_TIMEOUT_MS, MSG91_TOKEN_AUTH, MSG91_WIDGET_ID } from './config';
import { sdk } from './sdk';
import { createWidgetClient, type WidgetClient } from './widgetClient';

export { isMsg91WidgetConfigured } from './config';
export type { WidgetClient } from './widgetClient';

let client: WidgetClient | null = null;

/** The one MSG91 session client for the app (created on first use). */
export function getWidgetClient(): WidgetClient {
  client ??= createWidgetClient(sdk, { widgetId: MSG91_WIDGET_ID, tokenAuth: MSG91_TOKEN_AUTH, timeoutMs: MSG91_TIMEOUT_MS });
  return client;
}
