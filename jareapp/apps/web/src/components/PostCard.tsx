import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, MoreHorizontal, Pin } from 'lucide-react';
import Avatar from './Avatar';
import ReactionBar from './ReactionBar';
import { formatRelativeTime, truncateText } from '../utils/helpers';

interface PostCardProps {
  post: {
    id: string;
    contentAr?: string;
    contentEn?: string;
    category: string;
    author: { id: string; firstName: string; displayName?: string; avatarUrl?: string };
    neighborhood?: { nameAr: string; nameEn: string };
    images?: string[];
    isPinned?: boolean;
    isAnonymous?: boolean;
    myReaction?: string | null;
    _count?: { comments: number; reactions: number };
    createdAt: string;
  };
  onRefresh?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  SAFETY: 'bg-red-100 text-red-700',
  GENERAL: 'bg-blue-100 text-blue-700',
  MARKETPLACE: 'bg-green-100 text-green-700',
  SERVICES: 'bg-purple-100 text-purple-700',
  LOST_AND_FOUND: 'bg-yellow-100 text-yellow-700',
  ANNOUNCEMENTS: 'bg-indigo-100 text-indigo-700',
  RECOMMENDATIONS: 'bg-pink-100 text-pink-700',
  COMPLAINTS: 'bg-orange-100 text-orange-700',
  EVENTS: 'bg-teal-100 text-teal-700',
};

export default function PostCard({ post, onRefresh }: PostCardProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const content = isAr ? (post.contentAr || post.contentEn || '') : (post.contentEn || post.contentAr || '');
  const authorName = post.isAnonymous
    ? t('post.anonymous')
    : (post.author.displayName || post.author.firstName);
  const neighborhoodName = post.neighborhood
    ? (isAr ? post.neighborhood.nameAr : post.neighborhood.nameEn)
    : '';

  return (
    <article
      className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            src={post.isAnonymous ? null : post.author.avatarUrl}
            name={post.isAnonymous ? '?' : authorName}
            size="sm"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-text-primary truncate">{authorName}</span>
              {post.isPinned && <Pin size={12} className="text-primary flex-shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              {neighborhoodName && <span>{neighborhoodName}</span>}
              {neighborhoodName && <span>·</span>}
              <span>{formatRelativeTime(post.createdAt, i18n.language)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`badge text-xs ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-700'}`}>
            {t(`post.categories.${post.category}`, { defaultValue: post.category })}
          </span>
          <button
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={16} className="text-text-muted" />
          </button>
        </div>
      </div>

      <p className={`text-sm text-text-primary mb-3 leading-relaxed ${isAr ? 'text-right' : 'text-left'}`}
         dir={isAr ? 'rtl' : 'ltr'}>
        {truncateText(content, 200)}
      </p>

      {post.images && post.images.length > 0 && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img
            src={post.images[0]}
            alt=""
            className="w-full h-48 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <ReactionBar
          postId={post.id}
          myReaction={post.myReaction}
          onUpdate={onRefresh}
          compact
        />
        <button
          className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors"
          onClick={() => navigate(`/posts/${post.id}`)}
        >
          <MessageCircle size={14} />
          <span>{post._count?.comments || 0}</span>
        </button>
      </div>
    </article>
  );
}
