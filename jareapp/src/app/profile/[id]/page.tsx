'use client';

import { use, useState, useEffect } from 'react';
import { MapPin, ShieldCheck, Calendar, MessageSquare, Star, Edit3, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import FeedPostCard from '@/components/feed/FeedPostCard';
import DemoModeBanner from '@/components/ui/DemoModeBanner';
import { ProfileSkeleton, FeedPostSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import type { User, Post } from '@/lib/types';
import { DUMMY_USERS, DUMMY_POSTS } from '@/lib/data/dummy-data';

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co';

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }           = use(params);
  const { profile: me, refreshProfile } = useAuth();

  const [user,      setUser]      = useState<User | null>(null);
  const [posts,     setPosts]     = useState<Post[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [bioDraft,  setBioDraft]  = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [saving,    setSaving]    = useState(false);

  const isCurrentUser = me?.id === id;

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (IS_DEMO) {
        const u = DUMMY_USERS.find(u => u.id === id) ?? DUMMY_USERS[0];
        setUser(u);
        setPosts(DUMMY_POSTS.filter(p => p.author_id === u.id));
        setLoading(false);
        return;
      }
      try {
        const [uRes, pRes] = await Promise.all([
          fetch(`/api/profile/${id}`),
          fetch(`/api/posts?authorId=${id}&limit=20`),
        ]);
        if (uRes.ok) setUser(await uRes.json());
        if (pRes.ok) setPosts(await pRes.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function startEditing() {
    setBioDraft(user?.bio ?? '');
    setNameDraft(user?.full_name ?? '');
    setEditing(true);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    if (IS_DEMO) {
      setUser(u => u ? { ...u, full_name: nameDraft, bio: bioDraft } : u);
      setEditing(false);
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/profile/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ full_name: nameDraft, bio: bioDraft }),
      });
      if (res.ok) {
        setUser(u => u ? { ...u, full_name: nameDraft, bio: bioDraft } : u);
        await refreshProfile();
      }
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">
        <ProfileSkeleton />
        <FeedPostSkeleton />
        <FeedPostSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-3">👤</p>
        <p className="font-semibold text-gray-700">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">
      {IS_DEMO && <DemoModeBanner />}

      {/* ── Profile header ───────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-brand-500 to-brand-700" />
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-3 flex items-end justify-between">
            <Avatar
              src={user.avatar_url}
              name={user.full_name}
              size="xl"
              className="ring-4 ring-white shadow-md"
            />
            {isCurrentUser ? (
              editing ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="btn-secondary text-sm flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button onClick={saveProfile} disabled={saving} className="btn-primary text-sm flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              ) : (
                <button onClick={startEditing} className="btn-secondary text-sm flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              )
            ) : (
              <button className="btn-primary text-sm flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2 mb-3">
              <input
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                className="input font-bold text-lg"
                placeholder="Full name"
              />
              <textarea
                value={bioDraft}
                onChange={e => setBioDraft(e.target.value)}
                className="input resize-none text-sm"
                rows={3}
                placeholder="Tell neighbors about yourself…"
                maxLength={200}
              />
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900">{user.full_name}</h1>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </>
          )}

          {user.verification_status === 'verified' && !editing && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-brand-700 font-medium">
              <ShieldCheck className="w-4 h-4" /> Verified Neighbor
            </div>
          )}
          {user.is_premium && !editing && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-600 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Premium Member
            </div>
          )}

          {user.bio && !editing && (
            <p className="mt-3 text-sm text-gray-700">{user.bio}</p>
          )}

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

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={String(posts.length)} label="Posts" />
        <StatCard value={String(posts.reduce((s, p) => s + p.reaction_count, 0))} label="Reactions" />
        <StatCard value={String(posts.reduce((s, p) => s + p.comment_count,  0))} label="Comments" />
      </div>

      {/* ── Posts ───────────────────────────────────────────── */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">
          {isCurrentUser ? 'Your posts' : `${user.full_name.split(' ')[0]}'s posts`}
        </h2>
        {posts.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-sm text-gray-500">No posts yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <FeedPostCard
                key={post.id}
                post={post}
                currentUserId={me?.id ?? 'user-1'}
                isDemoMode={IS_DEMO}
              />
            ))}
          </div>
        )}
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
