import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import { SkeletonList } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { formatRelativeTime } from '../utils/helpers';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../utils/socket';

export default function Messages() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuthStore();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Socket setup
  useEffect(() => {
    const socket = getSocket();
    socket.on('new_message', () => {
      queryClient.invalidateQueries({ queryKey: ['messages', userId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
    return () => { socket.off('new_message'); };
  }, [userId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations').then((r) => r.data.data),
    enabled: !userId,
  });

  const { data: thread, isLoading: loadingThread } = useQuery({
    queryKey: ['messages', userId],
    queryFn: () => api.get(`/messages/conversations/${userId}`).then((r) => r.data.data),
    enabled: !!userId,
    refetchInterval: 5000,
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      api.post(`/messages/conversations/${userId}`, {
        contentAr: isAr ? content : '',
        contentEn: !isAr ? content : '',
      }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', userId] });
    },
  });

  // Conversation list view
  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3">
          <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <MessageCircle size={20} className="text-primary" />
            {t('nav.messages')}
          </h1>
        </div>
        <div>
          {loadingConvs ? <SkeletonList count={4} /> : (
            conversations?.length === 0 ? (
              <EmptyState title={t('messages.empty')} message={t('messages.emptyMessage')} />
            ) : (
              (conversations || []).map((conv: any) => {
                const partner = conv.partner;
                const partnerName = partner?.displayName || partner?.firstName || 'Unknown';
                const lastMsg = conv.lastMessage;
                const lastContent = isAr ? (lastMsg?.contentAr || lastMsg?.contentEn) : (lastMsg?.contentEn || lastMsg?.contentAr);
                return (
                  <div
                    key={partner?.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-border transition-colors"
                    onClick={() => navigate(`/messages/${partner.id}`)}
                  >
                    <Avatar src={partner?.avatarUrl} name={partnerName} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{partnerName}</p>
                        {lastMsg && <span className="text-xs text-text-muted">{formatRelativeTime(lastMsg.createdAt, i18n.language)}</span>}
                      </div>
                      {lastContent && <p className="text-sm text-text-muted truncate">{lastContent}</p>}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    );
  }

  // Thread view
  const messages = thread?.messages || [];
  const partner = messages.find((m: any) => m.senderId !== user?.id)?.sender;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-screen">
      <div className="sticky top-0 bg-bg border-b border-border z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/messages')} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="rtl-flip" />
        </button>
        {partner && (
          <>
            <Avatar src={partner.avatarUrl} name={partner.displayName || partner.firstName} size="sm" />
            <p className="font-semibold">{partner.displayName || partner.firstName}</p>
          </>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-20">
        {loadingThread ? <SkeletonList count={5} /> : messages.map((msg: any) => {
          const isMine = msg.senderId === user?.id;
          const content = isAr ? (msg.contentAr || msg.contentEn) : (msg.contentEn || msg.contentAr);
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                isMine ? 'bg-primary text-white rounded-br-sm' : 'bg-surface border border-border text-text-primary rounded-bl-sm'
              }`} dir={isAr ? 'rtl' : 'ltr'}>
                {content}
                <p className={`text-xs mt-1 ${isMine ? 'text-white/70' : 'text-text-muted'}`}>
                  {formatRelativeTime(msg.createdAt, i18n.language)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 max-w-2xl mx-auto bg-bg border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('messages.typeMessage')}
            className="input-field flex-1"
            dir={isAr ? 'rtl' : 'ltr'}
            onKeyDown={(e) => e.key === 'Enter' && newMessage.trim() && sendMessage.mutate(newMessage.trim())}
          />
          <button
            onClick={() => newMessage.trim() && sendMessage.mutate(newMessage.trim())}
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="btn-primary px-3 flex items-center gap-1"
          >
            <Send size={18} className="rtl-flip" />
          </button>
        </div>
      </div>
    </div>
  );
}
