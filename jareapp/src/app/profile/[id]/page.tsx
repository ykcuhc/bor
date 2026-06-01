'use client';

import { use } from 'react';
import { MapPin, ShieldCheck, Calendar, MessageSquare, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import FeedPostCard from '@/components/feed/FeedPostCard';
import { DUMMY_USERS, DUMMY_POSTS } from '@/lib/data/dummy-data';

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = DUMMY_USERS.find(u => u.id === id) ?? DUMMY_USERS[0];
  const userPosts = DUMMY_POSTS.filter(p => p.author_id === user.id);
  const isCurrentUser = id === 'user-1';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="space-y-4">

        {/* ── Profile header card ──────────────────────────── */}
        <div className="card overflow-hidden">
          {/* Cover banner */}
          <div className="h-32 bg-gradient-to-r from-brand-500 to-brand-700" />

          <div className="px-6 pb-6">
            {/* Avatar — overlaps cover */}
            <div className="-mt-12 mb-3 flex items-end justify-between">
              <Avatar
                src={user.avatar_url}
                name={user.full_name}
                size="xl"
                className="ring-4 ring-white shadow-md"
              />
              {isCurrentUser ? (
                <button className="btn-secondary text-sm">Edit Profile</button>
              ) : (
                <button className="btn-primary text-sm flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              )}
            </div>

            {/* Name + username */}
            <h1 className="text-xl font-bold text-gray-900">{user.full_name}</h1>
            <p className="text-sm text-gray-500">@{user.username}</p>

            {/* Verification badge */}
            {user.verification_status === 'verified' && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-brand-700 font-medium">
                <ShieldCheck className="w-4 h-4" />
                Verified Neighbor
              </div>
            )}
            {user.is_premium && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-600 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                Premium Member
              </div>
            )}

            {/* Bio */}
            {user.bio && (
              <p className="mt-3 text-sm text-gray-700">{user.bio}</p>
            )}

            {/* Meta info row */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500">
              {user.neighborhood && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" />
                  {user.neighborhood.name_en}, {user.governorate?.name_en}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Stats row ────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={userPosts.length.toString()} label="Posts" />
          <StatCard value={userPosts.reduce((sum, p) => sum + p.reaction_count, 0).toString()} label="Reactions received" />
          <StatCard value={userPosts.reduce((sum, p) => sum + p.comment_count, 0).toString()} label="Comments received" />
        </div>

        {/* ── Posts section ────────────────────────────────── */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">
            {isCurrentUser ? 'Your posts' : `${user.full_name.split(' ')[0]}'s posts`}
          </h2>
          {userPosts.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm text-gray-500">No posts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPosts.map(post => (
                <FeedPostCard key={post.id} post={post} currentUserId="user-1" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
