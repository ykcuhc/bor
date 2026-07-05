'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Lock, Shield, Bell, Palette, ShoppingBag, Database,
  ChevronRight, Check, X, Eye, EyeOff, AlertTriangle, Download,
  LogOut, Trash2, Search, Camera, Globe, Clock, BadgeCheck,
  Loader2, Save, Edit3, CheckCircle2, Smartphone, Monitor, Sun,
  Moon, RefreshCw, Info, Link as LinkIcon, KeyRound, BarChart3,
  UserCheck, EyeOff as EyeOffIcon, Volume2, Mail, MessageSquare,
  Package, Heart, Tag, ChevronDown, MapPin,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Section =
  | 'account'
  | 'security'
  | 'privacy'
  | 'notifications'
  | 'appearance'
  | 'marketplace'
  | 'data';

interface LocalPrefs {
  theme:    'light' | 'dark' | 'system';
  language: 'en' | 'ar';
  country:  string;
  timezone: string;
  notifications: {
    push:  { messages: boolean; orders: boolean; promotions: boolean; priceDrops: boolean };
    email: { security: boolean; orders: boolean; account: boolean; marketing: boolean };
    sms:   { security: boolean; orders: boolean };
    frequency: 'instant' | 'daily' | 'weekly';
  };
  privacy: {
    profileVisibility:    'public' | 'private';
    contactPermissions:   'everyone' | 'followers' | 'none';
    listingVisibility:    'public' | 'followers' | 'private';
    searchVisibility:     boolean;
    marketplaceDiscovery: boolean;
    personalizedRecs:     boolean;
    marketingConsent:     boolean;
    dataUsage:            boolean;
  };
  marketplace: {
    favoriteCategories:  string[];
    defaultSort:         string;
    showSponsored:       boolean;
    trackRecentlyViewed: boolean;
    trendingRecs:        boolean;
  };
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

// ─── Constants ────────────────────────────────────────────────────────────────

const PREFS_KEY           = 'miova_prefs';
const USERNAME_CHANGED_KEY= 'miova_username_changed_at';
const USERNAME_COOLDOWN   = 30 * 24 * 3600 * 1000; // 30 days

const DEFAULT_PREFS: LocalPrefs = {
  theme:    'system',
  language: 'en',
  country:  'KW',
  timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kuwait',
  notifications: {
    push:  { messages: true, orders: true, promotions: true,  priceDrops: true  },
    email: { security: true, orders: true, account:  true,   marketing: false  },
    sms:   { security: true, orders: true },
    frequency: 'instant',
  },
  privacy: {
    profileVisibility:    'public',
    contactPermissions:   'everyone',
    listingVisibility:    'public',
    searchVisibility:     true,
    marketplaceDiscovery: true,
    personalizedRecs:     true,
    marketingConsent:     false,
    dataUsage:            true,
  },
  marketplace: {
    favoriteCategories:  [],
    defaultSort:         'newest',
    showSponsored:       true,
    trackRecentlyViewed: true,
    trendingRecs:        true,
  },
};

const CATEGORIES = ['Women', 'Men', 'Kids', 'Home', 'Electronics', 'Beauty', 'Pets', 'Garden'];

const TIMEZONES = [
  'Asia/Kuwait', 'Asia/Dubai', 'Asia/Riyadh', 'Africa/Cairo', 'Asia/Beirut',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
  'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
];

const COUNTRIES = [
  { code: 'KW', name: 'Kuwait' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },   { code: 'QA', name: 'Qatar' },
  { code: 'BH', name: 'Bahrain' }, { code: 'OM', name: 'Oman' },
  { code: 'EG', name: 'Egypt' }, { code: 'JO', name: 'Jordan' },
  { code: 'LB', name: 'Lebanon' }, { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' }, { code: 'IN', name: 'India' },
];

const SECTIONS_META: Array<{ id: Section; label: string; description: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'account',       label: 'Account',         description: 'Profile, photo, contact info', Icon: User         },
  { id: 'security',      label: 'Security',         description: 'Password, sessions, activity',  Icon: Lock         },
  { id: 'privacy',       label: 'Privacy',          description: 'Visibility and permissions',    Icon: Shield       },
  { id: 'notifications', label: 'Notifications',    description: 'Push, email, SMS controls',     Icon: Bell         },
  { id: 'appearance',    label: 'Appearance',       description: 'Theme, language, region',       Icon: Palette      },
  { id: 'marketplace',   label: 'Marketplace',      description: 'Shopping preferences',          Icon: ShoppingBag  },
  { id: 'data',          label: 'Data & Account',   description: 'Export data, delete account',   Icon: Database     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deepMerge<T extends object>(base: T, over: DeepPartial<T>): T {
  const r = { ...base };
  for (const k in over) {
    const v = over[k];
    if (v !== undefined && v !== null && typeof v === 'object' && !Array.isArray(v)) {
      (r as any)[k] = deepMerge((base as any)[k] ?? {}, v as any);
    } else if (v !== undefined) {
      (r as any)[k] = v;
    }
  }
  return r;
}

function downloadJSON(data: object, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else if (theme === 'light') {
    html.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    prefersDark ? html.classList.add('dark') : html.classList.remove('dark');
  }
}

function applyLanguage(lang: 'en' | 'ar') {
  document.documentElement.lang = lang;
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
}

function canChangeUsername(): boolean {
  try {
    const last = localStorage.getItem(USERNAME_CHANGED_KEY);
    if (!last) return true;
    return Date.now() - parseInt(last) > USERNAME_COOLDOWN;
  } catch { return true; }
}

function usernameChangeCooldownDays(): number {
  try {
    const last = localStorage.getItem(USERNAME_CHANGED_KEY);
    if (!last) return 0;
    return Math.ceil((USERNAME_COOLDOWN - (Date.now() - parseInt(last))) / 86_400_000);
  } catch { return 0; }
}

// ─── useLocalPrefs hook ───────────────────────────────────────────────────────

function useLocalPrefs(): [LocalPrefs, (patch: DeepPartial<LocalPrefs>) => void] {
  const [prefs, setPrefs] = useState<LocalPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    try {
      const s = localStorage.getItem(PREFS_KEY);
      if (s) setPrefs(p => deepMerge(p, JSON.parse(s)));
    } catch {}
  }, []);

  const patch = useCallback((updates: DeepPartial<LocalPrefs>) => {
    setPrefs(prev => {
      const next = deepMerge(prev, updates);
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return [prefs, patch];
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Toggle({ checked, onChange, id, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; id?: string; disabled?: boolean;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed',
        checked ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700',
      )}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
        checked ? 'translate-x-5' : 'translate-x-0',
      )} />
    </button>
  );
}

function Row({ label, description, htmlFor, children }: {
  label: string; description?: string; htmlFor?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="flex-1 min-w-0 pt-0.5">
        <label htmlFor={htmlFor} className={cn('text-sm font-medium text-gray-900 dark:text-white block', htmlFor && 'cursor-pointer')}>
          {label}
        </label>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Card({ title, subtitle, children, danger }: {
  title: string; subtitle?: string; children: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className={cn('rounded-2xl border overflow-hidden mb-4', danger ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800')}>
      <div className={cn('px-5 py-4 border-b', danger ? 'border-red-200 dark:border-red-900/40' : 'border-gray-100 dark:border-gray-800')}>
        <h2 className={cn('text-sm font-bold', danger ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white')}>{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, maxLength, type = 'text', disabled, hint, error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  maxLength?: number; type?: string; disabled?: boolean; hint?: string; error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2.5 rounded-xl border text-sm text-gray-900 dark:text-white bg-transparent placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-colors',
          error ? 'border-red-300 dark:border-red-700 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:ring-brand-500',
          disabled && 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800',
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      {maxLength && (
        <p className="text-xs text-gray-400 text-right">{value.length}/{maxLength}</p>
      )}
    </div>
  );
}

function PwInput({ label, value, onChange, placeholder, autoFocus }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          autoFocus={autoFocus}
          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white bg-transparent placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1} aria-label={show ? 'Hide' : 'Show'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function PwStrength({ pw }: { pw: string }) {
  if (!pw) return null;
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors  = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500', 'bg-emerald-500'];
  return (
    <div>
      <div className="flex gap-1 mt-2 mb-1">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-all', i <= score ? colors[score] : 'bg-gray-200 dark:bg-gray-700')} />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{labels[score]}</p>
    </div>
  );
}

// ─── Re-auth Modal ────────────────────────────────────────────────────────────

function ReauthModal({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [pw, setPw]         = useState('');
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser }     = useStore();

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onCancel]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pw || !currentUser?.email) return;
    setLoading(true); setErr('');
    try {
      const { error } = await getSupabaseClient().auth.signInWithPassword({ email: currentUser.email, password: pw });
      if (error) { setErr('Incorrect password. Please try again.'); return; }
      onSuccess();
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal aria-label="Confirm identity">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Your Identity</h2>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">For your security, please re-enter your password to continue.</p>
        <form onSubmit={submit} className="space-y-3">
          <PwInput value={pw} onChange={setPw} autoFocus />
          {err && <p className="text-xs text-red-500">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            <button type="submit" disabled={loading || !pw} className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ title, body, confirmLabel = 'Confirm', destructive = false, loading = false, onConfirm, onCancel }: {
  title: string; body: string; confirmLabel?: string; destructive?: boolean; loading?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="alertdialog" aria-modal aria-label={title}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up">
        {destructive && <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-500" /></div>}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5 leading-relaxed">{body}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={cn('flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50', destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-600 hover:bg-brand-700')}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Account Section ──────────────────────────────────────────────────────────

function AccountSection({ showToast, initAuth }: { showToast: (m: string, t?: 'success'|'error'|'info') => void; initAuth: () => Promise<void> }) {
  const { currentUser, updateProfile } = useStore();
  const [saving,    setSaving]   = useState(false);
  const [reauth,    setReauth]   = useState(false);
  const [reauthFor, setReauthFor] = useState<'email' | 'delete' | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [username,  setUsername]  = useState('');
  const [bio,       setBio]       = useState('');
  const [location,  setLocation]  = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newEmail,  setNewEmail]  = useState('');

  // Username availability
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownDays  = usernameChangeCooldownDays();

  useEffect(() => {
    if (!currentUser) return;
    const [fn, ...rest] = (currentUser.displayName ?? '').split(' ');
    setFirstName(fn ?? '');
    setLastName(rest.join(' '));
    setUsername(currentUser.username ?? '');
    setBio(currentUser.bio ?? '');
    setLocation(currentUser.location ?? '');
    setAvatarUrl(currentUser.avatar ?? '');
  }, [currentUser]);

  function handleUsernameChange(val: string) {
    setUsername(val);
    setUsernameStatus('idle');
    if (val === currentUser?.username) return;
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (val.length < 3) return;
    usernameTimer.current = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (!res.ok) { setUsernameStatus('invalid'); return; }
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch { setUsernameStatus('invalid'); }
    }, 600);
  }

  async function saveProfile() {
    if (!currentUser) return;
    const usernameChanged = username !== currentUser.username;
    if (usernameChanged && !canChangeUsername()) {
      showToast(`Username can be changed again in ${cooldownDays} day${cooldownDays > 1 ? 's' : ''}`, 'info');
      return;
    }
    if (usernameChanged && usernameStatus === 'taken') {
      showToast('That username is already taken', 'error');
      return;
    }
    setSaving(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('users').update({
        display_name: `${firstName.trim()} ${lastName.trim()}`.trim() || currentUser.displayName,
        username:     username.toLowerCase().trim(),
        bio:          bio.trim(),
        location:     location.trim(),
        avatar:       avatarUrl.trim() || null,
      }).eq('id', currentUser.id);

      if (error) throw error;

      if (usernameChanged) {
        try { localStorage.setItem(USERNAME_CHANGED_KEY, String(Date.now())); } catch {}
      }

      updateProfile({
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        username:    username.toLowerCase().trim(),
        bio:         bio.trim(),
        location:    location.trim(),
        avatar:      avatarUrl.trim(),
      });
      await initAuth();
      showToast('Profile updated successfully', 'success');
    } catch {
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function changeEmail() {
    if (!newEmail.trim()) return;
    setSaving(true);
    try {
      const { error } = await getSupabaseClient().auth.updateUser({
        email:              newEmail.trim(),
        email_redirect_to:  `${window.location.origin}/auth/callback`,
      } as Parameters<ReturnType<typeof getSupabaseClient>['auth']['updateUser']>[0]);
      if (error) throw error;
      setNewEmail('');
      showToast('Verification email sent to your new address. Check both inboxes.', 'success');
    } catch {
      showToast('Failed to initiate email change. Please try again.', 'error');
    } finally {
      setSaving(false); setReauth(false);
    }
  }

  if (!currentUser) return null;

  return (
    <div>
      {/* Avatar */}
      <Card title="Profile Photo">
        <div className="py-4 flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 flex-shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">{currentUser.displayName[0]}</div>
              }
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">Photo URL</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={e => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">Paste a direct image URL (HTTPS). Image optimization support coming soon.</p>
          </div>
        </div>
      </Card>

      {/* Profile info */}
      <Card title="Personal Information">
        <div className="py-4 grid sm:grid-cols-2 gap-4">
          <FieldInput label="First Name" value={firstName} onChange={setFirstName} placeholder="First name" maxLength={30} />
          <FieldInput label="Last Name"  value={lastName}  onChange={setLastName}  placeholder="Last name"  maxLength={30} />
          <div className="sm:col-span-2">
            <FieldInput
              label="Username"
              value={username}
              onChange={handleUsernameChange}
              placeholder="your_username"
              maxLength={20}
              disabled={!canChangeUsername()}
              hint={!canChangeUsername() ? `Can be changed again in ${cooldownDays} day${cooldownDays > 1 ? 's' : ''}` : 'Letters, numbers, underscores, periods · 3–20 chars'}
              error={usernameStatus === 'taken' ? 'This username is already taken' : usernameStatus === 'invalid' ? 'Invalid username format' : ''}
            />
            {usernameStatus === 'available' && username !== currentUser.username && (
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Available</p>
            )}
            {usernameStatus === 'checking' && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking...</p>
            )}
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={250}
              rows={3}
              placeholder="Tell buyers about yourself..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{bio.length}/250</p>
          </div>
          <div className="sm:col-span-2">
            <FieldInput label="Location" value={location} onChange={setLocation} placeholder="e.g. Kuwait City, Kuwait" maxLength={80} />
          </div>
        </div>
        <div className="pb-4">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </Card>

      {/* Account details (read-mostly) */}
      <Card title="Account Details" subtitle="Sensitive changes require re-authentication">
        <Row label="Email Address" description="Your sign-in email. Changing it sends verification emails to both addresses.">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{currentUser.email}</span>
            <button
              onClick={() => { setReauth(true); setReauthFor('email'); }}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium flex-shrink-0"
            >
              Change
            </button>
          </div>
        </Row>
        <Row label="Date of Birth" description="Per platform policy, date of birth cannot be edited after registration.">
          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Restricted</span>
        </Row>
        <Row label="Member Since" description="">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(currentUser.joinedAt).toLocaleDateString('en-KW', { year: 'numeric', month: 'long' })}
          </span>
        </Row>
        <div className="h-4" />
      </Card>

      {/* Re-auth gate → email change form */}
      {reauth && reauthFor === 'email' && (
        <ReauthModal
          onCancel={() => { setReauth(false); setReauthFor(null); }}
          onSuccess={() => setReauth(false)}
        />
      )}
      {!reauth && reauthFor === 'email' && (
        <ConfirmModal
          title="Change Email Address"
          body={`Enter your new email. We'll send verification links to both your current and new address.`}
          confirmLabel={saving ? 'Sending…' : 'Send Verification'}
          loading={saving}
          onCancel={() => setReauthFor(null)}
          onConfirm={changeEmail}
        />
      )}
    </div>
  );
}

// ─── Security Section ─────────────────────────────────────────────────────────

function SecuritySection({ showToast }: { showToast: (m: string, t?: 'success'|'error'|'info') => void }) {
  const { currentUser, logout } = useStore();
  const router = useRouter();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwError,   setPwError]   = useState('');
  const [reauth,    setReauth]    = useState(false);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ browser: string; platform: string; lastSeen: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (session) {
        const ua = navigator.userAgent;
        const browser  = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Browser';
        const platform = /Mobile|Android|iPhone|iPad/.test(ua) ? 'Mobile' : 'Desktop';
        setSessionInfo({ browser, platform, lastSeen: new Date(session.expires_at ? session.expires_at * 1000 - 3600_000 : Date.now()).toISOString() });
      }
    })();
  }, []);

  async function changePassword() {
    setPwError('');
    if (!currentPw)              { setPwError('Enter your current password.'); return; }
    if (newPw.length < 8)        { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw)     { setPwError('Passwords do not match.'); return; }
    if (newPw === currentPw)     { setPwError('New password must be different from the current one.'); return; }
    setReauth(true);
  }

  async function doPasswordChange() {
    setReauth(false);
    setPwSaving(true);
    try {
      const { error } = await getSupabaseClient().auth.updateUser({ password: newPw });
      if (error) throw error;
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showToast('Password changed successfully.', 'success');
    } catch {
      showToast('Failed to change password. Please try again.', 'error');
    } finally {
      setPwSaving(false);
    }
  }

  async function logoutAll() {
    setLogoutAllOpen(false);
    try {
      await getSupabaseClient().auth.signOut({ scope: 'global' });
      await logout();
      router.push('/auth/login');
      showToast('Signed out from all devices.', 'success');
    } catch {
      showToast('Failed to sign out all sessions.', 'error');
    }
  }

  return (
    <div>
      {/* Change password */}
      <Card title="Change Password">
        <div className="py-4 space-y-4">
          <PwInput label="Current Password" value={currentPw} onChange={setCurrentPw} />
          <PwInput label="New Password"     value={newPw}     onChange={setNewPw} />
          <PwStrength pw={newPw} />
          <PwInput label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} />
          {pwError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{pwError}</p>}
          <button
            onClick={changePassword}
            disabled={pwSaving || !currentPw || !newPw || !confirmPw}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Update Password
          </button>
        </div>
      </Card>

      {/* Active sessions */}
      <Card title="Active Sessions" subtitle="Devices currently signed into your account">
        <div className="py-4 space-y-3">
          {sessionInfo && (
            <div className="flex items-start gap-3 p-3 bg-brand-50 dark:bg-brand-950/30 rounded-xl border border-brand-100 dark:border-brand-900/30">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
                {sessionInfo.platform === 'Mobile' ? <Smartphone className="w-4 h-4 text-white" /> : <Monitor className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{sessionInfo.browser} · {sessionInfo.platform}</p>
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-semibold">Current</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active session — last seen recently</p>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">Full session history requires advanced security features, available in a future update.</p>
          <button
            onClick={() => setLogoutAllOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out All Other Devices
          </button>
        </div>
      </Card>

      {/* Login activity */}
      <Card title="Login Activity" subtitle="Recent sign-in events for your account">
        <div className="py-4">
          <div className="flex items-start gap-3 p-3 rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Successful login</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {sessionInfo?.browser ?? 'Browser'} · {sessionInfo?.platform ?? 'Device'} · Just now
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Detailed login history with timestamps, devices, and locations will be available in a future security update.</p>
        </div>
      </Card>

      {/* 2FA — architecture ready */}
      <Card title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account">
        <div className="py-4 space-y-3">
          {[
            { icon: <Smartphone className="w-4 h-4" />, label: 'Authenticator App',  desc: 'TOTP (Google Authenticator, Authy)', badge: 'Recommended' },
            { icon: <Mail      className="w-4 h-4" />, label: 'Email OTP',           desc: 'One-time code sent to your email',    badge: null },
            { icon: <MessageSquare className="w-4 h-4" />, label: 'SMS OTP',         desc: 'Code sent to your phone number',      badge: null },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">{m.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.label}</span>
                  {m.badge && <span className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full font-semibold">{m.badge}</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{m.desc}</p>
              </div>
              <button onClick={() => showToast('Two-Factor Authentication coming soon', 'info')} className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700">
                Enable
              </button>
            </div>
          ))}
        </div>
      </Card>

      {reauth && <ReauthModal onSuccess={doPasswordChange} onCancel={() => setReauth(false)} />}
      {logoutAllOpen && (
        <ConfirmModal
          title="Sign Out All Devices"
          body="This will sign you out of all active sessions including this device. You'll need to sign in again."
          confirmLabel="Sign Out All"
          destructive
          onConfirm={logoutAll}
          onCancel={() => setLogoutAllOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Privacy Section ──────────────────────────────────────────────────────────

function PrivacySection({ prefs, patchPrefs }: { prefs: LocalPrefs; patchPrefs: (p: DeepPartial<LocalPrefs>) => void }) {
  const p = prefs.privacy;
  const set = (k: Partial<LocalPrefs['privacy']>) => patchPrefs({ privacy: k });

  return (
    <div>
      <Card title="Visibility" subtitle="Control who can see your profile and listings">
        <Row label="Profile Visibility" description="Who can view your full profile page">
          <select value={p.profileVisibility} onChange={e => set({ profileVisibility: e.target.value as any })}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </Row>
        <Row label="Listing Visibility" description="Default visibility for your product listings">
          <select value={p.listingVisibility} onChange={e => set({ listingVisibility: e.target.value as any })}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="public">Public</option>
            <option value="followers">Followers only</option>
            <option value="private">Private</option>
          </select>
        </Row>
        <Row label="Search Visibility" description="Appear in search results and directory" htmlFor="search-vis">
          <Toggle id="search-vis" checked={p.searchVisibility} onChange={v => set({ searchVisibility: v })} />
        </Row>
        <Row label="Marketplace Discovery" description="Appear in 'Recommended Sellers' and browse pages" htmlFor="mkt-disc">
          <Toggle id="mkt-disc" checked={p.marketplaceDiscovery} onChange={v => set({ marketplaceDiscovery: v })} />
        </Row>
        <div className="h-2" />
      </Card>

      <Card title="Contact & Interaction" subtitle="Control how others can contact you">
        <Row label="Contact Permissions" description="Who can message you directly">
          <select value={p.contactPermissions} onChange={e => set({ contactPermissions: e.target.value as any })}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="everyone">Everyone</option>
            <option value="followers">Followers only</option>
            <option value="none">No one</option>
          </select>
        </Row>
        <div className="h-2" />
      </Card>

      <Card title="Data & Personalization">
        <Row label="Personalized Recommendations" description="Use your activity to improve product suggestions" htmlFor="pers-recs">
          <Toggle id="pers-recs" checked={p.personalizedRecs} onChange={v => set({ personalizedRecs: v })} />
        </Row>
        <Row label="Marketing Consent" description="Receive personalized marketing offers based on your data" htmlFor="mkt-consent">
          <Toggle id="mkt-consent" checked={p.marketingConsent} onChange={v => set({ marketingConsent: v })} />
        </Row>
        <Row label="Analytics Data Usage" description="Allow Miova to use anonymized data to improve the platform" htmlFor="data-usage">
          <Toggle id="data-usage" checked={p.dataUsage} onChange={v => set({ dataUsage: v })} />
        </Row>
        <div className="h-2" />
      </Card>
    </div>
  );
}

// ─── Notifications Section ────────────────────────────────────────────────────

function NotificationsSection({ prefs, patchPrefs }: { prefs: LocalPrefs; patchPrefs: (p: DeepPartial<LocalPrefs>) => void }) {
  const n   = prefs.notifications;
  const set = (k: DeepPartial<LocalPrefs['notifications']>) => patchPrefs({ notifications: k });

  return (
    <div>
      <Card title="Push Notifications" subtitle="Delivered to your device">
        <Row label="New Messages"     htmlFor="pn-msg">   <Toggle id="pn-msg"   checked={n.push.messages}   onChange={v => set({ push: { messages:   v } })} /></Row>
        <Row label="Order Updates"    htmlFor="pn-ord">   <Toggle id="pn-ord"   checked={n.push.orders}     onChange={v => set({ push: { orders:     v } })} /></Row>
        <Row label="Promotions"       htmlFor="pn-promo"> <Toggle id="pn-promo" checked={n.push.promotions}  onChange={v => set({ push: { promotions: v } })} /></Row>
        <Row label="Price Drops" description="When an item you liked drops in price" htmlFor="pn-pd">
          <Toggle id="pn-pd" checked={n.push.priceDrops} onChange={v => set({ push: { priceDrops: v } })} />
        </Row>
        <div className="h-2" />
      </Card>

      <Card title="Email Notifications" subtitle="Delivered to your registered email">
        <Row label="Security Alerts" description="Password changes, logins from new devices" htmlFor="en-sec">
          <Toggle id="en-sec" checked={n.email.security} onChange={v => set({ email: { security: v } })} />
        </Row>
        <Row label="Order Confirmations" htmlFor="en-ord"> <Toggle id="en-ord" checked={n.email.orders}  onChange={v => set({ email: { orders:  v } })} /></Row>
        <Row label="Account Updates"     htmlFor="en-acc"> <Toggle id="en-acc" checked={n.email.account} onChange={v => set({ email: { account: v } })} /></Row>
        <Row label="Marketing Emails" description="Deals, news, and promotional content" htmlFor="en-mkt">
          <Toggle id="en-mkt" checked={n.email.marketing} onChange={v => set({ email: { marketing: v } })} />
        </Row>
        <div className="h-2" />
      </Card>

      <Card title="SMS Notifications" subtitle="Delivered to your mobile number">
        <Row label="Security Alerts" description="OTP and login verification (always on)" htmlFor="sms-sec">
          <Toggle id="sms-sec" checked={n.sms.security} disabled onChange={() => {}} />
        </Row>
        <Row label="Order Updates" htmlFor="sms-ord">
          <Toggle id="sms-ord" checked={n.sms.orders} onChange={v => set({ sms: { orders: v } })} />
        </Row>
        <div className="h-2" />
      </Card>

      <Card title="Notification Frequency">
        <div className="py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">How often to batch non-urgent push and email notifications</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Notification frequency">
            {(['instant', 'daily', 'weekly'] as const).map(f => (
              <button
                key={f}
                role="radio"
                aria-checked={n.frequency === f}
                onClick={() => set({ frequency: f })}
                className={cn(
                  'py-2.5 rounded-xl border text-sm font-semibold capitalize transition-colors',
                  n.frequency === f
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                )}
              >
                {f === 'instant' ? 'Instant' : f === 'daily' ? 'Daily Digest' : 'Weekly'}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Appearance Section ───────────────────────────────────────────────────────

function AppearanceSection({ prefs, patchPrefs }: { prefs: LocalPrefs; patchPrefs: (p: DeepPartial<LocalPrefs>) => void }) {
  function setTheme(theme: LocalPrefs['theme']) {
    patchPrefs({ theme });
    applyTheme(theme);
  }
  function setLanguage(lang: LocalPrefs['language']) {
    patchPrefs({ language: lang });
    applyLanguage(lang);
  }

  const themes: Array<{ id: LocalPrefs['theme']; label: string; Icon: React.FC<{ className?: string }> }> = [
    { id: 'light',  label: 'Light',  Icon: Sun     },
    { id: 'dark',   label: 'Dark',   Icon: Moon    },
    { id: 'system', label: 'System', Icon: Monitor },
  ];

  return (
    <div>
      <Card title="Theme" subtitle="Choose how Miova looks on your device">
        <div className="py-4 grid grid-cols-3 gap-3">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              aria-pressed={prefs.theme === t.id}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all',
                prefs.theme === t.id
                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
              )}
            >
              <t.Icon className={cn('w-6 h-6', prefs.theme === t.id ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400')} />
              <span className={cn('text-sm font-semibold', prefs.theme === t.id ? 'text-brand-700 dark:text-brand-300' : 'text-gray-600 dark:text-gray-400')}>
                {t.label}
              </span>
              {prefs.theme === t.id && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Language & Region">
        <Row label="Language" description="Interface language. Arabic enables full RTL layout.">
          <div className="flex gap-2">
            {(['en', 'ar'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                aria-pressed={prefs.language === lang}
                className={cn(
                  'px-3 py-1.5 rounded-xl border text-sm font-semibold transition-colors',
                  prefs.language === lang
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                )}
              >
                {lang === 'en' ? 'English' : 'العربية'}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Country / Region">
          <select
            value={prefs.country}
            onChange={e => patchPrefs({ country: e.target.value })}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </Row>
        <Row label="Time Zone">
          <select
            value={prefs.timezone}
            onChange={e => patchPrefs({ timezone: e.target.value })}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
          </select>
        </Row>
        <div className="h-2" />
      </Card>
    </div>
  );
}

// ─── Marketplace Section ──────────────────────────────────────────────────────

function MarketplaceSection({ prefs, patchPrefs }: { prefs: LocalPrefs; patchPrefs: (p: DeepPartial<LocalPrefs>) => void }) {
  const m   = prefs.marketplace;
  const set = (k: Partial<LocalPrefs['marketplace']>) => patchPrefs({ marketplace: k });

  function toggleCategory(cat: string) {
    const current = m.favoriteCategories;
    const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
    set({ favoriteCategories: next });
  }

  return (
    <div>
      <Card title="Favorite Categories" subtitle="We'll prioritize these in your feed and recommendations">
        <div className="py-4 flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              aria-pressed={m.favoriteCategories.includes(cat)}
              className={cn(
                'px-3 py-1.5 rounded-xl border text-sm font-semibold transition-colors',
                m.favoriteCategories.includes(cat)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        {m.favoriteCategories.length === 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 pb-4">No categories selected — all categories shown equally.</p>
        )}
      </Card>

      <Card title="Search & Discovery">
        <Row label="Default Sort Order" description="How search results are ordered by default">
          <select value={m.defaultSort} onChange={e => set({ defaultSort: e.target.value })}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="newest">Newest First</option>
            <option value="most_liked">Most Popular</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </Row>
        <Row label="Trending Recommendations" description="Show trending items on your homepage" htmlFor="trend-recs">
          <Toggle id="trend-recs" checked={m.trendingRecs} onChange={v => set({ trendingRecs: v })} />
        </Row>
        <Row label="Sponsored Content" description="Show promoted listings in search results" htmlFor="sponsored">
          <Toggle id="sponsored" checked={m.showSponsored} onChange={v => set({ showSponsored: v })} />
        </Row>
        <Row label="Recently Viewed Tracking" description="Remember and display your recently viewed items" htmlFor="recently-viewed">
          <Toggle id="recently-viewed" checked={m.trackRecentlyViewed} onChange={v => set({ trackRecentlyViewed: v })} />
        </Row>
        <div className="h-2" />
      </Card>
    </div>
  );
}

// ─── Data & Account Section ───────────────────────────────────────────────────

function DataSection({ showToast, logout }: { showToast: (m: string, t?: 'success'|'error'|'info') => void; logout: () => Promise<void> }) {
  const { currentUser } = useStore();
  const router = useRouter();

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen,     setDeleteOpen]     = useState(false);
  const [deleteReauth,   setDeleteReauth]   = useState(false);
  const [deleteLoading,  setDeleteLoading]  = useState(false);
  const [exportLoading,  setExportLoading]  = useState<string | null>(null);

  async function exportProfile() {
    if (!currentUser) return;
    setExportLoading('profile');
    await new Promise(r => setTimeout(r, 400));
    downloadJSON({
      username:     currentUser.username,
      displayName:  currentUser.displayName,
      bio:          currentUser.bio,
      location:     currentUser.location,
      joinedAt:     currentUser.joinedAt,
      isVerified:   currentUser.isVerified,
      stats: {
        listings:  currentUser.listingsCount,
        sold:      currentUser.soldCount,
        followers: currentUser.followersCount,
        following: currentUser.followingCount,
        rating:    currentUser.averageRating,
      },
    }, `miova-profile-${currentUser.username}.json`);
    setExportLoading(null);
    showToast('Profile data exported', 'success');
  }

  async function exportActivity() {
    if (!currentUser) return;
    setExportLoading('activity');
    const supabase = getSupabaseClient();
    const { data: listings } = await supabase
      .from('listings')
      .select('id, title, category, listing_price, status, created_at')
      .eq('seller_id', currentUser.id)
      .order('created_at', { ascending: false });
    downloadJSON({ listings: listings ?? [], exportedAt: new Date().toISOString() }, `miova-activity-${currentUser.username}.json`);
    setExportLoading(null);
    showToast('Activity data exported', 'success');
  }

  async function deactivateAccount() {
    setDeactivateOpen(false);
    await logout();
    router.push('/auth/login');
    showToast('Your account has been deactivated. Sign in again to reactivate.', 'info');
  }

  async function deleteAccount() {
    setDeleteReauth(false);
    setDeleteLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setDeleteLoading(false);
    setDeleteOpen(false);
    showToast('Account deletion request submitted. Your account will be removed within 30 days.', 'info');
    await logout();
    router.push('/');
  }

  return (
    <div>
      <Card title="Export Your Data" subtitle="Download a copy of your Miova account data">
        <div className="py-4 space-y-3">
          {[
            { id: 'profile', label: 'Profile & Account Info', desc: 'Your profile, stats, and account settings', action: exportProfile },
            { id: 'activity', label: 'Listing & Activity History', desc: 'All your listings and marketplace activity', action: exportActivity },
          ].map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <Download className="w-5 h-5 text-brand-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
              <button
                onClick={item.action}
                disabled={exportLoading === item.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold flex-shrink-0"
              >
                {exportLoading === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Export
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Connected Services — architecture ready */}
      <Card title="Connected Services" subtitle="Third-party accounts and integrations">
        <div className="py-4 space-y-3">
          {[
            { name: 'Google',  icon: '🔑', desc: 'Sign in with Google' },
            { name: 'Apple',   icon: '🍎', desc: 'Sign in with Apple' },
            { name: 'Wallet',  icon: '💳', desc: 'Payment wallet integration' },
          ].map(s => (
            <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <span className="text-xl w-8 text-center">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{s.desc}</p>
              </div>
              <button onClick={() => showToast(`${s.name} integration coming soon`, 'info')} className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800">
                Connect
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger zone */}
      <Card title="Danger Zone" danger>
        <Row label="Deactivate Account" description="Temporarily disable your account. Sign in again to reactivate at any time.">
          <button onClick={() => setDeactivateOpen(true)} className="px-4 py-2 rounded-xl border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 text-sm font-semibold hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors">
            Deactivate
          </button>
        </Row>
        <Row label="Delete Account" description="Permanently remove your account, listings, and all data. This cannot be undone.">
          <button onClick={() => setDeleteOpen(true)} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </Row>
        <div className="h-2" />
      </Card>

      {deactivateOpen && (
        <ConfirmModal
          title="Deactivate Account"
          body="Your profile will be hidden and you'll be signed out. You can reactivate by signing in again."
          confirmLabel="Deactivate"
          destructive
          onConfirm={deactivateAccount}
          onCancel={() => setDeactivateOpen(false)}
        />
      )}

      {deleteOpen && !deleteReauth && (
        <ConfirmModal
          title="Delete Your Account"
          body="This permanently removes your account, all listings, purchase history, and data. You have a 30-day window to cancel by contacting support."
          confirmLabel="Proceed"
          destructive
          onConfirm={() => { setDeleteOpen(false); setDeleteReauth(true); }}
          onCancel={() => setDeleteOpen(false)}
        />
      )}

      {deleteReauth && (
        <ReauthModal
          onSuccess={deleteAccount}
          onCancel={() => setDeleteReauth(false)}
        />
      )}
    </div>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function SettingsPage() {
  const { currentUser, isAuthenticated, showToast, logout, initAuth } = useStore();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<Section>('account');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [prefs, patchPrefs]               = useLocalPrefs();

  // Redirect if not signed in
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/settings');
    }
  }, [isAuthenticated, router]);

  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SECTIONS_META;
    return SECTIONS_META.filter(s =>
      s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  function navigate(id: Section) {
    setActiveSection(id);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!isAuthenticated || !currentUser) return null;

  const activeMeta = SECTIONS_META.find(s => s.id === activeSection)!;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your account, privacy, and preferences</p>
          </div>
          {/* Mobile nav toggle */}
          <button
            onClick={() => setMobileNavOpen(v => !v)}
            className="md:hidden flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200"
            aria-expanded={mobileNavOpen}
          >
            <activeMeta.Icon className="w-4 h-4" />
            {activeMeta.label}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', mobileNavOpen && 'rotate-180')} />
          </button>
        </div>

        <div className="md:grid md:grid-cols-[240px_1fr] md:gap-6">
          {/* ── Sidebar nav ────────────────────────────────────────────────── */}
          <aside className={cn(
            'md:block md:sticky md:top-24 md:self-start',
            mobileNavOpen ? 'block mb-4' : 'hidden md:block',
          )}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {/* Search */}
              <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search settings…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    aria-label="Search settings"
                  />
                </div>
              </div>

              {/* Section list */}
              <nav aria-label="Settings sections">
                {filteredSections.length > 0 ? filteredSections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => navigate(s.id)}
                    aria-current={activeSection === s.id ? 'page' : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2',
                      activeSection === s.id
                        ? 'bg-brand-50 dark:bg-brand-950/30 border-brand-600 text-brand-700 dark:text-brand-300'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                    )}
                  >
                    <s.Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight">{s.label}</p>
                      <p className="text-xs opacity-70 truncate leading-tight mt-0.5">{s.description}</p>
                    </div>
                    {activeSection === s.id && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                )) : (
                  <p className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">No results for "{searchQuery}"</p>
                )}
              </nav>

              {/* Quick user card */}
              <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 flex-shrink-0">
                    {currentUser.avatar
                      ? <img src={currentUser.avatar} alt={currentUser.displayName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{currentUser.displayName[0]}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{currentUser.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">@{currentUser.username}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Content area ───────────────────────────────────────────────── */}
          <main aria-label={`${activeMeta.label} settings`}>
            <div className="flex items-center gap-2 mb-4">
              <activeMeta.Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{activeMeta.label}</h2>
            </div>

            {activeSection === 'account' && (
              <AccountSection showToast={showToast} initAuth={initAuth} />
            )}
            {activeSection === 'security' && (
              <SecuritySection showToast={showToast} />
            )}
            {activeSection === 'privacy' && (
              <PrivacySection prefs={prefs} patchPrefs={patchPrefs} />
            )}
            {activeSection === 'notifications' && (
              <NotificationsSection prefs={prefs} patchPrefs={patchPrefs} />
            )}
            {activeSection === 'appearance' && (
              <AppearanceSection prefs={prefs} patchPrefs={patchPrefs} />
            )}
            {activeSection === 'marketplace' && (
              <MarketplaceSection prefs={prefs} patchPrefs={patchPrefs} />
            )}
            {activeSection === 'data' && (
              <DataSection showToast={showToast} logout={logout} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
