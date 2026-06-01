'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import FeedPostCard from '@/components/feed/FeedPostCard';
import { FeedPostSkeleton } from '@/components/ui/Skeleton';
import { usePost } from '@/hooks/usePost';
import { useAuth } from '@/context/AuthContext';
import { DUMMY_POSTS, DUMMY_COMMENTS } from '@/lib/data/dummy-data';
import { IS_DEMO } from '@/lib/constants';

export default function PostDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const { profile } = useAuth();

  const postId       = params.id as string;
  const demoPost     = DUMMY_POSTS.find(p => p.id === postId);
  const demoComments = DUMMY_COMMENTS.filter(c => c.post_id === postId);

  const { post, comments, loading, error } = usePost(postId, IS_DEMO);

  const displayPost     = IS_DEMO ? (demoPost ?? null) : post;
  const displayComments = IS_DEMO ? demoComments : comments;

  if (loading && !IS_DEMO) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="h-6 w-16 bg-gray-100 rounded animate-pulse" />
        <FeedPostSkeleton />
      </div>
    );
  }

  if (error || (!loading && !displayPost)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔍</p>
        <p className="font-semibold text-gray-700 text-lg">Post not found</p>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          It may have been removed, or you don&apos;t have access.
        </p>
        <button onClick={() => router.back()} className="btn-secondary text-sm">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {displayPost && (
        <FeedPostCard
          post={{ ...displayPost, comment_count: displayComments.length || displayPost.comment_count }}
          currentUserId={profile?.id ?? 'user-1'}
          isDemoMode={IS_DEMO}
          initialCommentsOpen
          demoComments={displayComments}
        />
      )}
    </div>
  );
}
