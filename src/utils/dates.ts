import type { DatePreset } from '../types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getDateRange(preset: DatePreset): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - parseInt(preset) + 1);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

export function formatDateShort(isoDate: string): string {
  // isoDate: "YYYY-MM-DD"
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatPct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}
