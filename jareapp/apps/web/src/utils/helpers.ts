import { formatDistanceToNow, format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export function formatRelativeTime(date: string | Date, lang = 'ar'): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: lang === 'ar' ? ar : enUS,
  });
}

export function formatDate(date: string | Date, lang = 'ar'): string {
  return format(new Date(date), 'PPP', { locale: lang === 'ar' ? ar : enUS });
}

export function formatDateTime(date: string | Date, lang = 'ar'): string {
  return format(new Date(date), 'PPp', { locale: lang === 'ar' ? ar : enUS });
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500',
  'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function formatKuwaitPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('965')) return `+${cleaned}`;
  if (cleaned.length === 8) return `+965${cleaned}`;
  return `+965${cleaned}`;
}

export function isArabicText(text: string): boolean {
  const arabicRegex = /[؀-ۿ]/;
  return arabicRegex.test(text);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
