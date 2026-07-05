'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getSupabaseClient } from '@/lib/supabase/client';

type Status = 'loading' | 'success' | 'error';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus]       = useState<Status>('loading');
  const [errorMsg, setErrorMsg]   = useState('');

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const supabase = getSupabaseClient();

      // ── Implicit flow: exchange hash tokens ────────────────────────────────
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken  = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token:  accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            if (!cancelled) {
              setErrorMsg('Verification failed. The link may have expired.');
              setStatus('error');
            }
            return;
          }
        }
      }

      // ── PKCE flow: exchange code for session ───────────────────────────────
      if (typeof window !== 'undefined') {
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error && !cancelled) {
            setErrorMsg('Verification failed. The link may have expired.');
            setStatus('error');
            return;
          }
        }
      }

      // ── Check resulting session ────────────────────────────────────────────
      const { data: { session }, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error || !session) {
        setErrorMsg(
          error?.message
            ? 'Verification failed. Please request a new link.'
            : 'No session found. The link may have expired or already been used.',
        );
        setStatus('error');
        return;
      }

      setStatus('success');
      router.replace('/auth/verify-phone');
    }

    handleCallback();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm text-center">

        {/* Logo */}
        <Link href="/" className="inline-flex justify-center mb-8">
          <Logo size="lg" />
        </Link>

        {/* Loading */}
        {status === 'loading' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-10">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Verifying your account…
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Please wait while we confirm your email.
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Verification failed
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {errorMsg}
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href="/auth/verify-email"
                className="block w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors text-sm"
              >
                Resend verification email
              </Link>
              <Link
                href="/auth/login"
                className="block w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
