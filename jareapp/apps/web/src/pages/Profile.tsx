import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Edit2, MessageCircle, UserPlus, Crown } from 'lucide-react';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import { SkeletonCard } from '../components/Skeleton';
import { useAuthStore } from '../store/authStore';
import Modal from '../components/Modal';

export default function Profile() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user: currentUser, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = id || currentUser?.id;
  const isOwnProfile = !id || id === currentUser?.id;
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: currentUser?.firstName || '', displayName: currentUser?.displayName || '', bio: '' });

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.get(isOwnProfile ? '/users/me' : `/users/${userId}`).then((r) => r.data.data),
  });

  const { data: postsData } = useQuery({
    queryKey: ['profile-posts', userId],
    queryFn: () => api.get('/feed', { params: { authorId: userId } }).then((r) => r.data.data),
    enabled: !!userId,
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => api.patch('/users/me', data),
    onSuccess: (res) => {
      setUser(res.data.data);
      setShowEdit(false);
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });

  const connect = useMutation({
    mutationFn: () => api.post(`/users/${userId}/connect`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  });

  if (isLoading) return <div className="p-4"><SkeletonCard /></div>;

  const profile = profileData;
  const name = profile?.displayName || profile?.firstName || '';
  const posts = postsData?.posts || [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        {id && (
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="rtl-flip" />
          </button>
        )}
        <h1 className="font-semibold text-text-primary">{isOwnProfile ? t('nav.profile') : name}</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile header card */}
        <div className="card p-5 text-center">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <Avatar src={profile?.avatarUrl} name={name} size="xl" />
              {profile?.role === 'NEIGHBORHOOD_CHAMPION' && (
                <Crown size={16} className="absolute -top-1 -end-1 text-accent" />
              )}
            </div>
          </div>
          <h2 className="text-xl font-bold text-text-primary">{name}</h2>
          {profile?.bio && <p className="text-text-secondary text-sm mt-1">{profile.bio}</p>}
          {profile?.neighborhood && (
            <p className="text-text-muted text-xs mt-1">
              📍 {isAr ? profile.neighborhood.nameAr : profile.neighborhood.nameEn}
            </p>
          )}
          {profile?.role === 'NEIGHBORHOOD_CHAMPION' && (
            <span className="badge bg-accent/10 text-accent mt-2 inline-flex items-center gap-1">
              <Crown size={12} /> {t('profile.champion')}
            </span>
          )}

          <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="font-bold text-text-primary">{posts.length}</p>
              <p className="text-xs text-text-muted">{t('profile.posts')}</p>
            </div>
          </div>

          {isOwnProfile ? (
            <button onClick={() => setShowEdit(true)} className="btn-secondary w-full mt-4 flex items-center justify-center gap-2">
              <Edit2 size={16} /> {t('profile.edit')}
            </button>
          ) : (
            <div className="flex gap-2 mt-4">
              <button onClick={() => connect.mutate()} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <UserPlus size={16} /> {t('profile.connect')}
              </button>
              <button onClick={() => navigate(`/messages/${userId}`)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                <MessageCircle size={16} /> {t('profile.message')}
              </button>
            </div>
          )}
        </div>

        {/* Posts */}
        <div>
          <h3 className="font-semibold text-text-primary mb-3">{t('profile.posts')}</h3>
          <div className="space-y-3">
            {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title={t('profile.edit')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('profile.name')}</label>
            <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('profile.displayName')}</label>
            <input type="text" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('profile.bio')}</label>
            <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="input-field min-h-[80px] resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowEdit(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button onClick={() => updateProfile.mutate(editForm)} disabled={updateProfile.isPending} className="btn-primary flex-1">
              {updateProfile.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('common.save')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
