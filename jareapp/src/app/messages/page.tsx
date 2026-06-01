'use client';

import { useState } from 'react';
import { Send, Search, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import { DUMMY_USERS } from '@/lib/data/dummy-data';
import type { User } from '@/lib/types';

interface MockThread {
  user: User;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
}

// Mock conversation threads for the demo
const MOCK_THREADS: MockThread[] = [
  {
    user: DUMMY_USERS[1],
    lastMessage: 'Thanks for the heads up about the truck!',
    lastTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unread: true,
  },
  {
    user: DUMMY_USERS[2],
    lastMessage: 'Is the Galaxy still available?',
    lastTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unread: false,
  },
  {
    user: DUMMY_USERS[3],
    lastMessage: 'Wa alaikum assalam! Of course, everyone welcome.',
    lastTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    unread: false,
  },
];

interface MockMessage {
  id: string;
  senderId: string;
  body: string;
  time: string;
}

const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  'user-2': [
    { id: '1', senderId: 'user-2', body: 'Hey! Thanks for the heads up about the truck.', time: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
    { id: '2', senderId: 'user-1', body: 'Of course. Stay safe! I filed a report already.',  time: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
    { id: '3', senderId: 'user-2', body: 'Thanks for the heads up about the truck!',          time: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  ],
  'user-3': [
    { id: '4', senderId: 'user-3', body: 'Hi! Is the Galaxy S24 still available?', time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: '5', senderId: 'user-1', body: 'This is Mohammed\'s listing actually, you can DM him directly.',  time: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
    { id: '6', senderId: 'user-3', body: 'Is the Galaxy still available?', time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  ],
};

const CURRENT_USER = DUMMY_USERS[0];

export default function MessagesPage() {
  const [selectedThread, setSelectedThread] = useState<MockThread | null>(null);
  const [newMessage, setNewMessage]         = useState('');
  const [localMessages, setLocalMessages]   = useState(MOCK_MESSAGES);

  const messages = selectedThread ? (localMessages[selectedThread.user.id] ?? []) : [];

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    const msg: MockMessage = {
      id: `msg-${Date.now()}`,
      senderId: CURRENT_USER.id,
      body: newMessage.trim(),
      time: new Date().toISOString(),
    };

    setLocalMessages(prev => ({
      ...prev,
      [selectedThread.user.id]: [...(prev[selectedThread.user.id] ?? []), msg],
    }));
    setNewMessage('');
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="card overflow-hidden" style={{ height: 'calc(100vh - 6rem)' }}>
        <div className="flex h-full">

          {/* ── Thread list ──────────────────────────────────── */}
          <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <h1 className="font-semibold text-gray-900">Messages</h1>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input placeholder="Search conversations…" className="input pl-8 text-xs py-1.5" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {MOCK_THREADS.map(thread => (
                <button
                  key={thread.user.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${
                    selectedThread?.user.id === thread.user.id ? 'bg-brand-50' : ''
                  }`}
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

          {/* ── Chat window ──────────────────────────────────── */}
          {selectedThread ? (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <Avatar src={selectedThread.user.avatar_url} name={selectedThread.user.full_name} size="sm" />
                <div>
                  <p className="font-semibold text-sm text-gray-900">{selectedThread.user.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedThread.user.neighborhood?.name_en}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isMe = msg.senderId === CURRENT_USER.id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <Avatar src={selectedThread.user.avatar_url} name={selectedThread.user.full_name} size="xs" />
                      )}
                      <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-3 py-2 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}>
                          {msg.body}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 mx-1">
                          {formatDistanceToNow(new Date(msg.time), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedThread.user.full_name.split(' ')[0]}…`}
                  className="input flex-1"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg
                             disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <p className="text-5xl mb-4">💬</p>
                <p className="font-semibold text-gray-700">Select a conversation</p>
                <p className="text-sm text-gray-500 mt-1">
                  Private messages are only visible to you and the recipient.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
