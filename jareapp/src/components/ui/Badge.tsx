import { clsx } from 'clsx';
import type { PostCategory } from '@/lib/types';
import { POST_CATEGORY_META } from '@/lib/types';

interface BadgeProps {
  category: PostCategory;
  className?: string;
}

export default function Badge({ category, className }: BadgeProps) {
  const meta = POST_CATEGORY_META[category];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
        meta.color,
        className
      )}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
}
