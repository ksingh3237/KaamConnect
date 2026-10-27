import { beforeEach, describe, expect, it, vi } from 'vitest';

const notifications = vi.hoisted(() => ({
  setNotificationChannelAsync: vi.fn(),
  AndroidImportance: { HIGH: 6, MAX: 7 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  AndroidAudioUsage: { NOTIFICATION_RINGTONE: 6 },
  AndroidAudioContentType: { SONIFICATION: 4 },
}));
vi.mock('expo-notifications', () => notifications);

import { DEFAULT_CHANNEL_ID, LEAD_CHANNEL_ID, LEAD_SOUND_FILE, LEAD_VIBRATION, ensureAndroidChannels } from './pushChannels';

beforeEach(() => {
  vi.clearAllMocks();
  notifications.setNotificationChannelAsync.mockResolvedValue(undefined);
});

describe('ensureAndroidChannels', () => {
  it('names the channel ids the server sends (they must match KaamConnectBackendAPI push-alert.ts)', () => {
    expect(DEFAULT_CHANNEL_ID).toBe('default');
    expect(LEAD_CHANNEL_ID).toBe('new_leads');
    expect(LEAD_SOUND_FILE).toBe('new_lead.wav');
  });

  it('makes the lead channel the loudest kind: maximum importance, the bell, a long vibration, visible on the lock screen', async () => {
    await ensureAndroidChannels();
    const call = notifications.setNotificationChannelAsync.mock.calls.find(([id]) => id === 'new_leads');
    expect(call).toBeDefined();
    const options = call![1];
    expect(options).toMatchObject({
      importance: 7,
      sound: 'new_lead.wav',
      enableVibrate: true,
      lockscreenVisibility: 1,
      audioAttributes: { usage: 6 },
    });
    expect(options.vibrationPattern).toEqual(LEAD_VIBRATION);
    expect(LEAD_VIBRATION.filter((ms: number) => ms >= 500).length).toBeGreaterThanOrEqual(3);
  });

  it('keeps every other notification a normal high-importance pop-up that vibrates, without the bell', async () => {
    await ensureAndroidChannels();
    const options = notifications.setNotificationChannelAsync.mock.calls.find(([id]) => id === 'default')![1];
    expect(options).toMatchObject({ importance: 6, enableVibrate: true });
    expect(options.sound).toBeUndefined();
  });
});
