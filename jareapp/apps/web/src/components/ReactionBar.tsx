import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useState } from 'react';

const REACTIONS = [
  { type: 'LIKE', emoji: '👍', labelKey: 'reaction.like' },
  { type: 'LOVE', emoji: '❤️', labelKey: 'reaction.love' },
  { type: 'HAHA', emoji: '😂', labelKey: 'reaction.haha' },
  { type: 'WOW', emoji: '😮', labelKey: 'reaction.wow' },
  { type: 'SAD', emoji: '😢', labelKey: 'reaction.sad' },
  { type: 'ANGRY', emoji: '😡', labelKey: 'reaction.angry' },
];

interface ReactionBarProps {
  postId: string;
  reactions?: Record<string, number>;
  myReaction?: string | null;
  onUpdate?: () => void;
  compact?: boolean;
}

export default function ReactionBar({ postId, reactions = {}, myReaction, onUpdate, compact = false }: ReactionBarProps) {
  const { t } = useTranslation();
  const [localMyReaction, setLocalMyReaction] = useState(myReaction);
  const [localReactions, setLocalReactions] = useState(reactions);

  const totalReactions = Object.values(localReactions).reduce((sum, n) => sum + n, 0);

  async function handleReact(type: string) {
    const prev = localMyReaction;
    const prevCounts = { ...localReactions };

    // Optimistic update
    const newReactions = { ...localReactions };
    if (prev) newReactions[prev] = Math.max(0, (newReactions[prev] || 0) - 1);
    if (prev !== type) {
      newReactions[type] = (newReactions[type] || 0) + 1;
      setLocalMyReaction(type);
    } else {
      setLocalMyReaction(null);
    }
    setLocalReactions(newReactions);

    try {
      await api.post(`/posts/${postId}/react`, { type: prev === type ? null : type });
      onUpdate?.();
    } catch {
      setLocalMyReaction(prev);
      setLocalReactions(prevCounts);
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm text-text-secondary">
        {totalReactions > 0 && (
          <>
            <span>{REACTIONS.find((r) => r.type === localMyReaction)?.emoji || '👍'}</span>
            <span>{totalReactions}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {REACTIONS.map((r) => {
        const count = localReactions[r.type] || 0;
        const isActive = localMyReaction === r.type;
        return (
          <button
            key={r.type}
            onClick={() => handleReact(r.type)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-gray-100 text-text-secondary border border-transparent'
            }`}
          >
            <span>{r.emoji}</span>
            {count > 0 && <span className="font-medium">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
