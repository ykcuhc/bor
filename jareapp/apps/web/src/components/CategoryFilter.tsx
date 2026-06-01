import { useTranslation } from 'react-i18next';

const CATEGORIES = [
  { value: '', labelKey: 'post.categories.ALL' },
  { value: 'GENERAL', labelKey: 'post.categories.GENERAL' },
  { value: 'SAFETY', labelKey: 'post.categories.SAFETY' },
  { value: 'LOST_AND_FOUND', labelKey: 'post.categories.LOST_AND_FOUND' },
  { value: 'MARKETPLACE', labelKey: 'post.categories.MARKETPLACE' },
  { value: 'SERVICES', labelKey: 'post.categories.SERVICES' },
  { value: 'RECOMMENDATIONS', labelKey: 'post.categories.RECOMMENDATIONS' },
  { value: 'ANNOUNCEMENTS', labelKey: 'post.categories.ANNOUNCEMENTS' },
  { value: 'COMPLAINTS', labelKey: 'post.categories.COMPLAINTS' },
];

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-4 -mx-4">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selected === cat.value
              ? 'bg-primary text-white'
              : 'bg-surface text-text-secondary border border-border hover:border-primary hover:text-primary'
          }`}
        >
          {t(cat.labelKey, { defaultValue: cat.value || 'All' })}
        </button>
      ))}
    </div>
  );
}
