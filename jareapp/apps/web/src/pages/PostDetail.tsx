import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Share2, Flag } from 'lucide-react';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import ReactionBar from '../components/ReactionBar';
import { SkeletonCard } from '../components/Skeleton';
import { formatRelativeTime } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: () => api.get(`/posts/${id}`).then((r) => r.data.data),
  });

  const addComment = useMutation({
    mutationFn: (text: string) =>
      api.post('/comments', { postId: id, contentAr: isAr ? text : '', contentEn: !isAr ? text : '' }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
  });

  if (isLoading) return <div className="p-4"><SkeletonCard /><SkeletonCard /></div>;
  if (!data) return null;

  const post = data.post || data;
  const comments = data.comments || post.comments || [];
  const content = isAr ? (post.contentAr || post.contentEn) : (post.contentEn || post.contentAr);
  const authorName = post.isAnonymous ? t('post.anonymous') : (post.author?.displayName || post.author?.firstName);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-text-secondary rtl-flip" />
        </button>
        <h1 className="font-semibold text-text-primary">{t('post.detail')}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Post */}
        <div className="card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={post.isAnonymous ? null : post.author?.avatarUrl} name={authorName} />
            <div>
              <p className="font-semibold text-text-primary">{authorName}</p>
              <p className="text-xs text-text-muted">{formatRelativeTime(post.createdAt, i18n.language)}</p>
            </div>
          </div>

          <p className="text-text-primary leading-relaxed mb-3 whitespace-pre-wrap" dir={isAr ? 'rtl' : 'ltr'}>
            {content}
          </p>

          {post.images?.length > 0 && (
            <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: `repeat(${Math.min(post.images.length, 2)}, 1fr)` }}>
              {post.images.map((url: string, i: number) => (
                <img key={i} src={url} alt="" className="rounded-lg w-full h-48 object-cover" />
              ))}
            </div>
          )}

          <div className="border-t border-border pt-3">
            <ReactionBar postId={post.id} myReaction={post.myReaction} />
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            <button className="flex items-center gap-1 text-text-muted hover:text-primary text-sm transition-colors">
              <MessageCircle size={16} /> <span>{post._count?.comments || comments.length} {t('post.comments')}</span>
            </button>
            <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="flex items-center gap-1 text-text-muted hover:text-primary text-sm transition-colors">
              <Share2 size={16} /> {t('common.share')}
            </button>
            <button className="flex items-center gap-1 text-text-muted hover:text-danger text-sm transition-colors ms-auto">
              <Flag size={16} /> {t('common.report')}
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="space-y-3">
          <h2 className="font-semibold text-text-primary">{t('post.comments')}</h2>
          {comments.map((comment: any) => {
            const commentContent = isAr ? (comment.contentAr || comment.contentEn) : (comment.contentEn || comment.contentAr);
            return (
              <div key={comment.id} className="card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar src={comment.author?.avatarUrl} name={comment.author?.displayName || comment.author?.firstName || 'U'} size="sm" />
                  <div>
                    <p className="text-sm font-semibold">{comment.author?.displayName || comment.author?.firstName}</p>
                    <p className="text-xs text-text-muted">{formatRelativeTime(comment.createdAt, i18n.language)}</p>
                  </div>
                </div>
                <p className="text-sm text-text-primary" dir={isAr ? 'rtl' : 'ltr'}>{commentContent}</p>
              </div>
            );
          })}
        </div>

        {/* Comment input */}
        <div className="sticky bottom-16 lg:bottom-0 bg-bg border-t border-border p-4 -mx-4">
          <div className="flex gap-2">
            <Avatar src={user?.avatarUrl} name={user?.displayName || user?.firstName || 'U'} size="sm" />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('post.commentPlaceholder')}
                className="input-field flex-1"
                dir={isAr ? 'rtl' : 'ltr'}
                onKeyDown={(e) => e.key === 'Enter' && commentText.trim() && addComment.mutate(commentText.trim())}
              />
              <button
                onClick={() => commentText.trim() && addComment.mutate(commentText.trim())}
                disabled={!commentText.trim() || addComment.isPending}
                className="btn-primary px-3"
              >
                {addComment.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '→'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
