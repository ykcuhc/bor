'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { MapPin, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { signIn } from '@/app/auth/actions';

// useActionState requires an initial state object
const INITIAL_STATE = { error: '' };

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirect') ?? '/';

  const [state, formAction, pending] = useActionState(signIn, INITIAL_STATE);
  const [showPw, setShowPw] = useState(false);

  // On successful sign-in the server action calls redirect() — the component
  // will unmount before this effect fires for the success case.
  useEffect(() => {
    if (!state?.error && !pending) {
      // If redirect() didn't fire (demo/no-Supabase), navigate client-side
      window.location.href = redirectTo;
    }
  }, [state, pending, redirectTo]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <MapPin className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">JareApp</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your neighborhood</p>
        </div>

        <div className="card p-6 space-y-4">
          <form action={formAction} className="space-y-4">
            {/* Hidden field for redirect target */}
            <input type="hidden" name="redirect" value={redirectTo} />

            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="label mb-0">Password</label>
                <Link href="/auth/forgot" className="text-xs text-brand-600 hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="input pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {state?.error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {state.error}
              </div>
            )}

            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            New to JareApp?{' '}
            <Link href="/auth/signup" className="text-brand-600 hover:text-brand-700 font-medium">
              Create account
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
