'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a number',     test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, showToast } = useStore();
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const passwordStrength = PASSWORD_RULES.filter(r => r.test(form.password)).length;

  function update(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (passwordStrength < PASSWORD_RULES.length) {
      setError('Please meet all password requirements.');
      return;
    }
    if (!/^[a-z0-9_.]+$/.test(form.username)) {
      setError('Username can only contain lowercase letters, numbers, _ and .');
      return;
    }
    setLoading(true);
    const ok = await registerUser({
      username:    form.username.trim().toLowerCase(),
      email:       form.email.trim().toLowerCase(),
      password:    form.password,
      displayName: form.displayName.trim(),
    });
    setLoading(false);
    if (ok) {
      showToast('Welcome to Miova! 🎉', 'success');
      router.push('/');
    } else {
      setError('An account with this email or username already exists.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Logo size="lg" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Create your closet</h1>
          <p className="text-gray-500 mt-1">Start buying and selling for free</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.displayName}
                  onChange={e => update('displayName', e.target.value)}
                  placeholder="Layla Al-Ahmad"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={e => update('username', e.target.value.toLowerCase())}
                    placeholder="layla_q8"
                    className="w-full pl-7 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {PASSWORD_RULES.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          i < passwordStrength ? 'bg-green-500' : 'bg-gray-200'
                        )}
                      />
                    ))}
                  </div>
                  {PASSWORD_RULES.map(rule => (
                    <p key={rule.label} className={cn(
                      'text-xs flex items-center gap-1.5 transition-colors',
                      rule.test(form.password) ? 'text-green-600' : 'text-gray-400'
                    )}>
                      <CheckCircle2 className={cn('w-3.5 h-3.5', rule.test(form.password) ? 'text-green-500' : 'text-gray-300')} />
                      {rule.label}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:bg-brand-300 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Create My Closet'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-brand-600 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
