'use client';

import { useState, useEffect, useCallback } from 'react';
import { Pin, PinOff, Trash2, ShieldCheck, Users, BarChart2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { IS_DEMO } from '@/lib/constants';

type AdminTab = 'posts' | 'members' | 'stats';

interface AdminPost {
  id:            string;
  title:         string | null;
  body:          string;
  category:      string;
  is_pinned:     boolean;
  is_removed:    boolean;
  comment_count: number;
  reaction_count:number;
  created_at:    string;
  author?:       { id: string; full_name: string; avatar_url: string | null };
}

interface AdminMember {
  id:                  string;
  full_name:           string;
  username:            string;
  avatar_url:          string | null;
  verification_status: string;
  is_premium:          boolean;
  created_at:          string;
}

export default function AdminPage() {
  const { profile } = useAuth();
  const [tab,      setTab]      = useState<AdminTab>('posts');
  const [isAdmin,  setIsAdmin]  = useState(false);
  const [posts,    setPosts]    = useState<AdminPost[]>([]);
  const [members,  setMembers]  = useState<AdminMember[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [actionMsg,      setActionMsg]      = useState('');
  const [pendingRemoveId,setPendingRemoveId] = useState<string | null>(null);

  const neighborhoodId = profile?.neighborhood_id ?? '';

  const load = useCallback(async () => {
    if (IS_DEMO) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }
    if (!neighborhoodId) return; // keep loading spinner until profile is available

    try {
      const [adminRes, postsRes, membersRes] = await Promise.all([
        fetch(`/api/admin/check?neighborhoodId=${neighborhoodId}`),
        fetch(`/api/admin/posts?neighborhoodId=${neighborhoodId}`),
        fetch(`/api/admin/members?neighborhoodId=${neighborhoodId}`),
      ]);
      setIsAdmin(adminRes.ok && (await adminRes.json()).isAdmin);
      if (postsRes.ok)   setPosts(await postsRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
    } finally {
      setLoading(false);
    }
  }, [neighborhoodId]);

  useEffect(() => { load(); }, [load]);

  async function togglePin(postId: string, isPinned: boolean) {
    if (IS_DEMO) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !isPinned } : p));
      setActionMsg(isPinned ? 'Post unpinned' : 'Post pinned to top');
      setTimeout(() => setActionMsg(''), 2500);
      return;
    }
    const res = await fetch(`/api/admin/posts/${postId}/pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !isPinned }),
    });
    if (res.ok) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !isPinned } : p));
      setActionMsg(isPinned ? 'Post unpinned' : 'Post pinned to top');
      setTimeout(() => setActionMsg(''), 2500);
    }
  }

  async function removePost(postId: string) {
    // Two-step confirmation — first click arms, second click fires
    if (pendingRemoveId !== postId) {
      setPendingRemoveId(postId);
      setTimeout(() => setPendingRemoveId(null), 3000);
      return;
    }
    setPendingRemoveId(null);
    if (IS_DEMO) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setActionMsg('Post removed');
      setTimeout(() => setActionMsg(''), 2500);
      return;
    }
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setActionMsg('Post removed');
      setTimeout(() => setActionMsg(''), 2500);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading admin panel…
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Access denied</h1>
        <p className="text-gray-500 text-sm mb-6">
          You are not an admin of{' '}
          <span className="font-semibold">{profile?.neighborhood?.name_en ?? 'this neighborhood'}</span>.
        </p>
        <Link href="/" className="btn-secondary text-sm">Back to feed</Link>
      </div>
    );
  }

  const neighborhood = profile?.neighborhood;
  const verifiedCount = members.filter(m => m.verification_status === 'verified').length;
  const premiumCount  = members.filter(m => m.is_premium).length;
  const pinnedCount   = posts.filter(p => p.is_pinned).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <h1 className="text-xl font-bold text-gray-900">Neighborhood Admin</h1>
          </div>
          <p className="text-sm text-gray-500">
            {neighborhood?.name_en ?? 'Your neighborhood'} ·{' '}
            {IS_DEMO && <span className="text-amber-600">Demo mode</span>}
          </p>
        </div>
        <Link href="/" className="btn-secondary text-sm">Back to feed</Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total members',   value: IS_DEMO ? '1,247' : members.length, icon: '👥' },
          { label: 'Verified',        value: IS_DEMO ? '948'   : verifiedCount,  icon: '✓' },
          { label: 'Premium members', value: IS_DEMO ? '123'   : premiumCount,   icon: '⭐' },
          { label: 'Pinned posts',    value: IS_DEMO ? '2'     : pinnedCount,    icon: '📌' },
        ].map(stat => (
          <div key={stat.label} className="card p-3 text-center">
            <p className="text-2xl mb-0.5">{stat.icon}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card p-1 flex gap-1 w-fit">
        {([
          { key: 'posts',   label: 'Posts',   icon: <Pin className="w-3.5 h-3.5" /> },
          { key: 'members', label: 'Members', icon: <Users className="w-3.5 h-3.5" /> },
          { key: 'stats',   label: 'Stats',   icon: <BarChart2 className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.key ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === 'posts' && (
        <div className="space-y-2">
          {IS_DEMO ? (
            <DemoPosts onTogglePin={() => {}} onRemove={() => {}} />
          ) : posts.length === 0 ? (
            <div className="card p-8 text-center text-gray-400 text-sm">No posts yet</div>
          ) : (
            posts.map(post => (
              <AdminPostRow
                key={post.id}
                post={post}
                onTogglePin={() => togglePin(post.id, post.is_pinned)}
                onRemove={() => removePost(post.id)}
                pendingRemove={pendingRemoveId === post.id}
              />
            ))
          )}
        </div>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <div className="space-y-2">
          {IS_DEMO ? (
            <DemoMembers />
          ) : members.length === 0 ? (
            <div className="card p-8 text-center text-gray-400 text-sm">No members yet</div>
          ) : (
            members.map(member => (
              <div key={member.id} className="card p-3 flex items-center gap-3">
                <Avatar src={member.avatar_url} name={member.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {member.full_name}
                    {member.verification_status === 'verified' && (
                      <span className="ml-1 text-brand-600 text-xs">✓</span>
                    )}
                    {member.is_premium && <span className="ml-1 text-amber-500 text-xs">⭐</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    @{member.username} · Joined {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
                  </p>
                </div>
                <span className={clsx(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  member.verification_status === 'verified' ? 'bg-brand-50 text-brand-700'
                  : member.verification_status === 'pending' ? 'bg-blue-50 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
                )}>
                  {member.verification_status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && (
        <div className="card p-6 text-center">
          <p className="text-2xl mb-2">📊</p>
          <p className="font-semibold text-gray-700">Analytics coming soon</p>
          <p className="text-sm text-gray-400 mt-1">
            Post engagement, member growth, and activity heatmaps will appear here.
          </p>
        </div>
      )}

      {/* Toast */}
      {actionMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white
                        text-sm px-5 py-3 rounded-xl shadow-xl z-50 pointer-events-none">
          {actionMsg}
        </div>
      )}
    </div>
  );
}

function AdminPostRow({
  post,
  onTogglePin,
  onRemove,
  pendingRemove = false,
}: {
  post: AdminPost;
  onTogglePin: () => void;
  onRemove: () => void;
  pendingRemove?: boolean;
}) {
  return (
    <div className={clsx('card p-3 flex items-start gap-3', post.is_pinned && 'border-amber-200 bg-amber-50/30')}>
      {post.author && <Avatar src={post.author.avatar_url} name={post.author.full_name} size="sm" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Badge category={post.category as never} />
          {post.is_pinned && <span className="text-xs text-amber-600 font-medium flex items-center gap-0.5"><Pin className="w-3 h-3" />Pinned</span>}
        </div>
        {post.title && <p className="font-medium text-sm text-gray-900 truncate">{post.title}</p>}
        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{post.body}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {post.author?.full_name} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })} ·
          {' '}{post.comment_count} comments · {post.reaction_count} reactions
        </p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onTogglePin}
          title={post.is_pinned ? 'Unpin' : 'Pin to top'}
          className={clsx(
            'p-1.5 rounded-lg transition-colors text-xs',
            post.is_pinned ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' : 'text-gray-400 hover:bg-gray-100'
          )}
        >
          {post.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onRemove}
          title={pendingRemove ? 'Click again to confirm removal' : 'Remove post'}
          className={clsx(
            'p-1.5 rounded-lg transition-colors text-xs font-medium',
            pendingRemove
              ? 'bg-red-500 text-white hover:bg-red-600 px-2'
              : 'text-red-400 hover:bg-red-50'
          )}
        >
          {pendingRemove ? 'Confirm?' : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

const DEMO_POST_DATA: AdminPost[] = [
  { id: 'dp1', title: 'Block 3 road closure update', body: 'The road near the intersection will be closed until Friday...', category: 'general',  is_pinned: true,  is_removed: false, comment_count: 8,  reaction_count: 12, created_at: new Date(Date.now() - 3600000).toISOString(), author: { id: 'u1', full_name: 'Ahmad Al-Rashidi',  avatar_url: null } },
  { id: 'dp2', title: 'Suspicious vehicle',          body: 'Saw a white Toyota parked outside Block 12 for 3 days...', category: 'safety',   is_pinned: false, is_removed: false, comment_count: 4,  reaction_count: 6,  created_at: new Date(Date.now() - 7200000).toISOString(), author: { id: 'u2', full_name: 'Fatima Al-Sabah',   avatar_url: null } },
  { id: 'dp3', title: null,                          body: 'Does anyone know a good plumber in the area?',             category: 'question', is_pinned: false, is_removed: false, comment_count: 11, reaction_count: 3,  created_at: new Date(Date.now() - 86400000).toISOString(),author: { id: 'u3', full_name: 'Mohammed Al-Kandari',avatar_url: null } },
];

function DemoPosts({ onTogglePin, onRemove }: { onTogglePin: (id: string, pinned: boolean) => void; onRemove: (id: string) => void }) {
  const [demoPosts, setDemoPosts] = useState<AdminPost[]>(DEMO_POST_DATA);
  return (
    <>
      {demoPosts.map(post => (
        <AdminPostRow
          key={post.id}
          post={post}
          onTogglePin={() => {
            setDemoPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_pinned: !p.is_pinned } : p));
            onTogglePin(post.id, post.is_pinned);
          }}
          onRemove={() => {
            setDemoPosts(prev => prev.filter(p => p.id !== post.id));
            onRemove(post.id);
          }}
        />
      ))}
    </>
  );
}

const DEMO_MEMBERS: AdminMember[] = [
  { id: 'm1', full_name: 'Ahmad Al-Rashidi',  username: 'ahmad_rashidi', avatar_url: null, verification_status: 'verified', is_premium: false, created_at: '2024-01-15T10:00:00Z' },
  { id: 'm2', full_name: 'Fatima Al-Sabah',   username: 'fatima_sabah',  avatar_url: null, verification_status: 'verified', is_premium: true,  created_at: '2024-02-01T09:00:00Z' },
  { id: 'm3', full_name: 'Mohammed Kandari',  username: 'mo_kandari',    avatar_url: null, verification_status: 'pending',  is_premium: false, created_at: '2024-03-10T11:00:00Z' },
  { id: 'm4', full_name: 'Sara Al-Mutairi',   username: 'sara_mutairi',  avatar_url: null, verification_status: 'unverified',is_premium: false, created_at: '2024-04-20T14:00:00Z' },
];

function DemoMembers() {
  return (
    <>
      {DEMO_MEMBERS.map(member => (
        <div key={member.id} className="card p-3 flex items-center gap-3">
          <Avatar src={member.avatar_url} name={member.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900 truncate">
              {member.full_name}
              {member.verification_status === 'verified' && <span className="ml-1 text-brand-600 text-xs">✓</span>}
              {member.is_premium && <span className="ml-1 text-amber-500 text-xs">⭐</span>}
            </p>
            <p className="text-xs text-gray-400">
              @{member.username} · Joined {formatDistanceToNow(new Date(member.created_at), { addSuffix: true })}
            </p>
          </div>
          <span className={clsx(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            member.verification_status === 'verified'   ? 'bg-brand-50 text-brand-700'
            : member.verification_status === 'pending'  ? 'bg-blue-50 text-blue-700'
            : 'bg-gray-100 text-gray-500'
          )}>
            {member.verification_status}
          </span>
        </div>
      ))}
    </>
  );
}
