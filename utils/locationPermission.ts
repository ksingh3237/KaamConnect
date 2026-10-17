// Everything about asking a worker for the phone's location, in the order the system needs it:
//   1. is the phone's location switch on at all?   2. the "while using the app" permission   3. "all the time" (so the
//   customer's map keeps moving when the worker opens Google Maps or locks the phone).
// The explanation screen (components/WorkerLocationPermissionModal.tsx) is shown BEFORE this runs; this file only does the
// system part and, when the person has blocked it for good, offers the way to the phone's settings.
import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { confirmAction, notify } from './dialog';

/**
 *  granted      - foreground permission is on and the phone's location is on
 *  ask          - not decided yet, or denied once (the system may still ask)
 *  blocked      - denied for good: only the phone's settings can change it
 *  services_off - the phone's own location switch is off
 */
export type LocationAccess = 'granted' | 'ask' | 'blocked' | 'services_off';

/** Reads the current state without showing anything. */
export async function getLocationAccess(): Promise<LocationAccess> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return permission.canAskAgain ? 'ask' : 'blocked';
    return (await Location.hasServicesEnabledAsync()) ? 'granted' : 'services_off';
  } catch {
    return 'ask';
  }
}

async function openLocationSettings(): Promise<void> {
  try {
    if (Platform.OS === 'android') await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
    else await Linking.openSettings();
  } catch {
    await Linking.openSettings().catch(() => undefined);
  }
}

async function offerSettings(title: string, message: string, open: () => Promise<void>): Promise<void> {
  if (await confirmAction(title, message, 'Open settings / सेटिंग खोलें')) await open();
}

/**
 * Runs the whole request. Resolves with where things ended up and has already told the person what to do next when the
 * answer is not 'granted'. Never throws.
 */
export async function requestWorkerLocationAccess(): Promise<LocationAccess> {
  try {
    // 1. The phone's location switch (GPS hardware / master toggle)
    let servicesOn = await Location.hasServicesEnabledAsync();
    if (!servicesOn && Platform.OS === 'android') {
      // Shows Google's own "turn on location" prompt; it rejects if the person says no
      await Location.enableNetworkProviderAsync().catch(() => undefined);
      servicesOn = await Location.hasServicesEnabledAsync();
    }
    if (!servicesOn) {
      await offerSettings('Location is switched off / लोकेशन बंद है', 'Turn on Location (GPS) in your phone settings so customers can see you coming.', openLocationSettings);
      return 'services_off';
    }

    // 2. Permission while the app is open
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (!foreground.granted) {
      if (!foreground.canAskAgain) {
        await offerSettings(
          'Location permission is blocked / अनुमति बंद है',
          'You blocked location for KaamConnect. Open Settings > Permissions > Location and choose "Allow" so we can show your arrival to the customer.',
          () => Linking.openSettings(),
        );
        return 'blocked';
      }
      await notify('Location not allowed / लोकेशन की अनुमति नहीं', 'Without location the customer cannot see you coming and nearby jobs are harder to find. You can allow it any time from the job screen.');
      return 'ask';
    }

    // 3. "All the time", so sharing survives the worker switching to Google Maps. Optional: a no here is fine.
    if (Platform.OS !== 'web') {
      try {
        const background = await Location.getBackgroundPermissionsAsync();
        if (!background.granted && background.canAskAgain) await Location.requestBackgroundPermissionsAsync();
      } catch {
        /* the build has no background-location entry, or the person left the settings page: foreground sharing still works */
      }
    }
    return 'granted';
  } catch {
    await notify('Could not check location / लोकेशन नहीं मिली', 'Please check that location is on for your phone and try again.');
    return 'ask';
  }
}
