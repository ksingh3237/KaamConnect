// Web: MSG91's mobile widget does not run in a browser, so there is no SDK here. isMsg91WidgetConfigured() is false on
// the web and the app uses the backend's own OTP flow, so this is never called; it fails loudly if it ever is.
import type { OtpWidgetSdk } from './widgetClient';

const unsupported = () => Promise.reject(new Error('The MSG91 OTP widget is not available on the web'));

export const sdk: OtpWidgetSdk = {
  initializeWidget: unsupported,
  sendOTP: unsupported,
  retryOTP: unsupported,
  verifyOTP: unsupported,
  getWidgetProcess: unsupported,
};
