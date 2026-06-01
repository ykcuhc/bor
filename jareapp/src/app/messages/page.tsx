'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import DemoModeBanner from '@/components/ui/DemoModeBanner';
import { useMessages, type DMMessage } from '@/hooks/useMessages';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/lib/types';
import { DUMMY_USERS } from '@/lib/data/dummy-data';
import { IS_DEMO } from '@/lib/constants';

// Demo-mode thread mock data lives here so the component always has something to render
interface Thread {
  user:        User;
  lastMessage: string;
  lastTime:    string;
  unread:      boolean;
}

const DEMO_THREADS: Thread[] = [
  { user: DUMMY_USERS[1], lastMessage: 'Thanks for the heads up about the truck!',  lastTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), unread: true },
  { user: DUMMY_USERS[2], lastMessage: 'Is the Galaxy still available?',             lastTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), unread: false },
  { user: DUMMY_USERS[3], lastMessage: 'Wa alaikum assalam! Everyone is welcome.',   lastTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), unread: false },
];

const DEMO_MSG_MAP: Record<string, DMMessage[]> = {
  'user-2': [
    { id: '1', sender_id: 'user-2', recipient_id: 'user-1', body: 'Hey! Thanks for the warning.',            read_at: null, created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { id: '2', sender_id: 'user-1', recipient_id: 'user-2', body: 'Of course. Reported to police already.',   read_at: null, created_at: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
    { id: '3', sender_id: 'user-2', recipient_id: 'user-1', body: 'Thanks for the heads up about the truck!', read_at: null, created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  ],
  'user-3': [
    { id: '4', sender_id: 'user-3', recipient_id: 'user-1', body: 'Is the Galaxy S24 still available?',      read_at: null, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: '5', sender_id: 'user-1', recipient_id: 'user-3', body: 'That\'s Mohammed\'s listing, DM him.',    read_at: null, created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
  ],
};

function MessagesContent() {
  const { profile } = useAuth();
  const currentUser  = profile ?? DUMMY_USERS[0];
  const searchParams = useSearchParams();
  const withUserId   = searchParams.get('with');

  const [threads,         setThreads]         = useState<Thread[]>([]);
  const [selectedThread,  setSelectedThread]  = useState<Thread | null>(null);
  const [searchQuery,     setSearchQuery]      = useState('');
  const [newMessage,      setNewMessage]       = useState('');
  const [demoMsgs,        setDemoMsgs]         = useState(DEMO_MSG_MAP);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Live hook for the selected conversation
  const { messages: liveMsgs, sending, send } = useMessages(
    currentUser.id,
    selectedThread?.user.id ?? null,
    IS_DEMO
  );

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMsgs, demoMsgs, selectedThread]);

  // Load threads
  useEffect(() => {
    if (IS_DEMO) { setThreads(DEMO_THREADS); return; }
    fetch('/api/messages')
      .then(r => r.ok ? r.json() : [])
      .then((data: { other_user: User; last_message: string; last_time: string; unread_count: number }[]) => {
        setThreads(data.map(t => ({
          user:        t.other_user,
          lastMessage: t.last_message,
          lastTime:    t.last_time,
          unread:      t.unread_count > 0,
        })));
      })
      .catch(() => setThreads([]));
  }, []);

  // Auto-open thread when navigated from a profile via ?with=userId
  useEffect(() => {
    if (!withUserId || threads.length === 0) return;
    const existing = threads.find(t => t.user.id === withUserId);
    if (existing) { setSelectedThread(existing); return; }
    // Build a synthetic thread for users not yet in the list
    const targetUser = DUMMY_USERS.find(u => u.id === withUserId);
    if (targetUser && IS_DEMO) {
      const newThread: Thread = { user: targetUser, lastMessage: '', lastTime: new Date().toISOString(), unread: false };
      setThreads(prev => [newThread, ...prev]);
      setSelectedThread(newThread);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withUserId, threads.length]);

  const filteredThreads = threads.filter(t =>
    t.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayMessages: DMMessage[] = IS_DEMO && selectedThread
    ? (demoMsgs[selectedThread.user.id] ?? [])
    : liveMsgs;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;
    const body = newMessage.trim();
    setNewMessage('');

    if (IS_DEMO) {
      const msg: DMMessage = {
        id:           `msg-${Date.now()}`,
        sender_id:    currentUser.id,
        recipient_id: selectedThread.user.id,
        body,
        read_at:      null,
        created_at:   new Date().toISOString(),
      };
      setDemoMsgs(prev => ({
        ...prev,
        [selectedThread.user.id]: [...(prev[selectedThread.user.id] ?? []), msg],
      }));
      return;
    }

    await send(body);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 space-y-3" suppressHydrationWarning>
      {IS_DEMO && <DemoModeBanner />}

      <div className="card overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
        <div className="flex h-full">

          {/* ── Thread list ───────────────────────────────────── */}
          <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h1 className="font-semibold text-gray-900">Messages</h1>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search conversations…"
                  aria-label="Search conversations"
                  className="input pl-8 text-xs py-1.5"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">
                  {searchQuery ? 'No results' : 'No conversations yet'}
                </p>
              )}
              {filteredThreads.map(thread => (
                <button
                  key={thread.user.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50
                    ${selectedThread?.user.id === thread.user.id ? 'bg-brand-50' : ''}`}
                >
                  <div className="relative">
                    <Avatar src={thread.user.avatar_url} name={thread.user.full_name} size="sm" />
                    {thread.unread && (
                      <Circle className="absolute -top-0.5 -right-0.5 w-3 h-3 text-brand-600 fill-brand-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${thread.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {thread.user.full_name}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                        {formatDistanceToNow(new Date(thread.lastTime), { addSuffix: false })}
                      </span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${thread.unread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {thread.lastMessage}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Chat pane ──────────────────────────────────────── */}
          {selectedThread ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <Avatar src={selectedThread.user.avatar_url} name={selectedThread.user.full_name} size="sm" />
                <div>
                  <p className="font-semibold text-sm text-gray-900">{selectedThread.user.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedThread.user.neighborhood?.name_en}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {displayMessages.map(msg => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <Avatar
                          src={selectedThread.user.avatar_url}
                          name={selectedThread.user.full_name}
                          size="xs"
                        />
                      )}
                      <div className={`max-w-xs flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm ${
                          isMe ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}>
                          {msg.body}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 mx-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedThread.user.full_name.split(' ')[0]}…`}
                  className="input flex-1"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  {/* Arrow icon inline to avoid another import */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <p className="text-5xl mb-4">💬</p>
                <p className="font-semibold text-gray-700">Select a conversation</p>
                <p className="text-sm text-gray-500 mt-1">
                  Messages are end-to-end private — only you and the recipient can read them.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-8 text-center text-gray-400 text-sm">Loading messages…</div>}>
      <MessagesContent />
    </Suspense>
  );
}
