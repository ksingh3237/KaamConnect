// Alert.alert with buttons does nothing on react-native-web, so confirmations and notices go through here: the browser's
// own dialogs on web, the native Alert elsewhere.
import { Alert, Platform } from 'react-native';

export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

/** Resolves true only when the person confirms. */
export function confirmAction(title: string, message: string, confirmLabel = 'OK', destructive = false): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
