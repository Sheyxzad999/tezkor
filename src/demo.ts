/**
 * Brauzerda (Tauri'siz) ochilganda — dizaynni koʻrish va skrinshotlar uchun
 * namunaviy maʼlumotlar.
 */
import type { ClipItem } from './lib/clipboard.ts';

let t = 0;
const wave = (base: number, amp: number, speed: number, phase = 0) =>
  Math.max(0, Math.min(100, base + amp * Math.sin(t * speed + phase) + (Math.random() - 0.5) * amp * 0.6));

export function demoStats() {
  t += 1;
  const GB = 1024 ** 3;
  return {
    cpu: wave(34, 18, 0.35),
    cores: Array.from({ length: 10 }, (_, i) => wave(30 + (i % 4) * 8, 22, 0.5, i)),
    memUsed: 11.4 * GB + Math.sin(t * 0.1) * 0.3 * GB,
    memTotal: 16 * GB,
    swapUsed: 0.6 * GB,
    swapTotal: 2 * GB,
    netRx: (2.4 + 1.8 * Math.abs(Math.sin(t * 0.4))) * 1024 ** 2,
    netTx: (180 + 120 * Math.abs(Math.cos(t * 0.3))) * 1024,
    disks: [
      { name: 'Macintosh HD', mount: '/', total: 494 * GB, available: 187 * GB, removable: false },
      { name: 'Montaj SSD', mount: '/Volumes/Montaj SSD', total: 1000 * GB, available: 312 * GB, removable: true },
    ],
    uptime: 3 * 86400 + 5 * 3600 + 17 * 60,
    host: 'MacBook-Air',
    os: 'macOS 27.2',
  };
}

export function demoClips(): ClipItem[] {
  const now = Date.now();
  const m = 60_000;
  return [
    { id: 'd1', text: 'https://github.com/Sheyxzad999/tezkor', at: now - 1 * m },
    { id: 'd2', text: '#F0875A', at: now - 4 * m },
    { id: 'd3', text: 'const total = items.reduce((s, i) => s + i.price, 0);', at: now - 9 * m, pinned: true },
    { id: 'd4', text: '+998 90 123 45 67', at: now - 26 * m },
    { id: 'd5', text: '{"order_id": 42, "amount": 150000, "status": "paid"}', at: now - 52 * m },
    { id: 'd6', text: 'Ertaga soat 10:00 da mijoz bilan uchrashuv — taqdimotni tayyorlash', at: now - 3 * 60 * m },
    { id: 'd7', text: '1 250 000', at: now - 5 * 60 * m },
  ];
}
