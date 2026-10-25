// Android only. Two libraries write the same default-notification settings into AndroidManifest.xml:
//   - expo-notifications (our channel id "default" and the green notification colour, from the plugin options in app.json)
//   - @react-native-firebase/messaging (its own empty / white placeholders)
// Android's manifest merger refuses to pick one ("Attribute meta-data#com.google.firebase.messaging.default_... is also
// present at [:react-native-firebase_messaging]"), which failed the EAS build in "processReleaseMainManifest".
// `tools:replace` on OUR entries tells the merger that the app's value wins, which is the intent.
//
// This plugin must be listed BEFORE "expo-notifications" in app.json: Expo applies manifest changes last-registered
// first, so listing it earlier makes it run after expo-notifications has written the entries it patches.
const { withAndroidManifest } = require('expo/config-plugins');

const REPLACE = {
  'com.google.firebase.messaging.default_notification_channel_id': 'android:value',
  'com.google.firebase.messaging.default_notification_color': 'android:resource',
};

module.exports = function withFirebaseManifestFix(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] ?? 'http://schemas.android.com/tools';
    const application = manifest.application?.[0];
    for (const meta of application?.['meta-data'] ?? []) {
      const attribute = REPLACE[meta.$['android:name']];
      if (attribute) meta.$['tools:replace'] = attribute;
    }
    return cfg;
  });
};
