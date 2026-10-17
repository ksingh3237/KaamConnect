// Extends app.json with the pieces that need the Google Maps key. The key comes from EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
// (.env.local, or the EAS build profile's env): the same value the JS code uses for Places search and geocoding.
// With no key the plugins still apply; the app then shows "map search is not set up" instead of a map.
//
// Location: workers share their position while on the way to a job (utils/workerTracking.ts). The "always" permission
// lets that keep going when the worker opens Google Maps or locks the phone, so it needs ACCESS_BACKGROUND_LOCATION
// (Android) and the location background mode (iOS). Both are native entries: rebuild the dev client / EAS build after
// changing them. Google Play asks for a background-location declaration when an app ships this permission.
module.exports = ({ config }) => {
  const key = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      ['react-native-maps', { androidGoogleMapsApiKey: key, iosGoogleMapsApiKey: key }],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'KaamConnect uses your location to fill in your address and to match you with workers nearby.',
          locationAlwaysAndWhenInUsePermission:
            'KaamConnect shares your live position with the customer while you are on the way to a job, even if you switch to Google Maps. It stops when you arrive.',
          isAndroidBackgroundLocationEnabled: true,
          isIosBackgroundLocationEnabled: true,
        },
      ],
    ],
  };
};
