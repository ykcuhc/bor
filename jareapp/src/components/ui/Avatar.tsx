'use client';

import Image from 'next/image';
import { clsx } from 'clsx';

interface AvatarProps {
  src: string | null | undefined;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  xs: { px: 24, cls: 'w-6 h-6 text-xs' },
  sm: { px: 32, cls: 'w-8 h-8 text-xs' },
  md: { px: 40, cls: 'w-10 h-10 text-sm' },
  lg: { px: 56, cls: 'w-14 h-14 text-base' },
  xl: { px: 80, cls: 'w-20 h-20 text-xl' },
};

// Deterministic color from name so the same user always gets the same color
function colorFromName(name: string): string {
  const colors = [
    'bg-rose-400', 'bg-amber-400', 'bg-emerald-500',
    'bg-sky-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500',
  ];
  const idx = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const { px, cls } = SIZE_MAP[size];
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  if (src) {
    return (
      <div className={clsx('relative rounded-full overflow-hidden flex-shrink-0', cls, className)}>
        <Image src={src} alt={name} width={px} height={px} className="object-cover w-full h-full" />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
        cls,
        colorFromName(name),
        className
      )}
    >
      {initials}
    </div>
  );
}
