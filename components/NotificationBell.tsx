// The header bell: a red badge with the unread count, and the inbox opens on tap. The count is shared
// (store/useNotifications.ts), so the bell on Home and the one on Leads always agree.
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useNotifications } from '../store/useNotifications';
import NotificationInboxModal from './NotificationInboxModal';

export default function NotificationBell() {
  const unread = useNotifications((s) => s.unread);
  const [open, setOpen] = useState(false);
  const label = unread > 99 ? '99+' : String(unread);

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
      >
        <Bell color={Colors.textMain} size={20} />
        {unread > 0 && (
          <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Text style={styles.badgeText}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
      <NotificationInboxModal visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', lineHeight: 14 },
});
