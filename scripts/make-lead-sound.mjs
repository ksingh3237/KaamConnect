// Writes assets/sounds/new_lead.wav: a bell struck four times, loud and bright enough to be heard from a pocket.
// Synthesised here (inharmonic partials with their own decay, the way a struck metal bell sounds), so there is no
// third-party audio and no licence to track. Replace the file with any .wav of your own and rebuild the app: the
// name must stay `new_lead.wav` because the server (notifications/push-alert.ts) and the Android channel refer to it.
//   node scripts/make-lead-sound.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 22050;
const STRIKES = [0, 0.85, 1.7, 2.55]; // seconds
const TOTAL = 4.4;
const BASE = 880; // Hz
// [frequency ratio, amplitude, decay time constant in seconds]
const PARTIALS = [
  [1.0, 1.0, 0.9],
  [2.0, 0.6, 0.65],
  [2.76, 0.45, 0.5],
  [5.4, 0.3, 0.3],
  [8.93, 0.18, 0.18],
];

const samples = new Float32Array(Math.floor(RATE * TOTAL));
for (const start of STRIKES) {
  const from = Math.floor(start * RATE);
  for (let i = from; i < samples.length; i += 1) {
    const t = (i - from) / RATE;
    if (t > 2.2) break;
    const attack = Math.min(1, t / 0.003); // 3 ms: a click-free strike
    let v = 0;
    for (const [ratio, amp, tau] of PARTIALS) v += amp * Math.exp(-t / tau) * Math.sin(2 * Math.PI * BASE * ratio * t);
    samples[i] += v * attack;
  }
}
let peak = 0;
for (const s of samples) peak = Math.max(peak, Math.abs(s));
const gain = 0.92 / peak;

const data = Buffer.alloc(samples.length * 2);
samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * gain)) * 32767), i * 2));
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16); // PCM
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
mkdirSync('assets/sounds', { recursive: true });
writeFileSync('assets/sounds/new_lead.wav', Buffer.concat([header, data]));
console.log(`assets/sounds/new_lead.wav: ${(44 + data.length) / 1024 | 0} KB, ${TOTAL} s`);
