'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MailOpen, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getSupabaseClient } from '@/lib/supabase/client';

const MAX_RESENDS = 3;
const COOLDOWN_SECS = 60;

// ─── Inner component (needs Suspense because it calls useSearchParams) ────────

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [resendCount,  setResendCount]  = useState(0);
  const [cooldown,     setCooldown]     = useState(0);
  const [resending,    setResending]    = useState(false);
  const [resendError,  setResendError]  = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function handleResend() {
    if (resendCount >= MAX_RESENDS || cooldown > 0 || !email) return;
    setResending(true);
    setResendError('');
    setResendSuccess(false);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });

    setResending(false);
    if (error) {
      setResendError('Could not resend the email. Please try again.');
    } else {
      setResendCount(c => c + 1);
      setCooldown(COOLDOWN_SECS);
      setResendSuccess(true);
    }
  }

  const exhausted = resendCount >= MAX_RESENDS;
  const canResend  = !exhausted && cooldown === 0 && !resending;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center">
            <Logo size="lg" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
              <MailOpen className="w-8 h-8 text-brand-600" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            Check your inbox
          </h1>

          {/* Subtext */}
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
            We sent a verification link to{' '}
            {email ? (
              <strong className="text-gray-900 dark:text-white">{email}</strong>
            ) : (
              'your email address'
            )}
            . Click the link to activate your account.
          </p>

          {/* Spam note */}
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
            Don&apos;t see it? Check your spam or junk folder.
          </p>

          {/* Resend success */}
          {resendSuccess && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-xl text-center">
              Verification email resent successfully.
            </div>
          )}

          {/* Resend error */}
          {resendError && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {resendError}
            </div>
          )}

          {/* Resend button */}
          <div className="mt-6">
            {exhausted ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Too many attempts. Please{' '}
                <a href="mailto:support@miova.com" className="text-brand-600 hover:underline">
                  contact support
                </a>
                .
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={!canResend}
                className="w-full py-3 border border-brand-600 text-brand-600 font-semibold rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {resending && <Loader2 className="w-4 h-4 animate-spin" />}
                {resending
                  ? 'Sending...'
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : 'Resend verification email'}
              </button>
            )}
          </div>

          {/* Back link */}
          <div className="mt-4 text-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Wrong email? Go back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page (wraps in Suspense for useSearchParams) ─────────────────────────────

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
