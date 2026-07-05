'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';

const OTP_LENGTH  = 6;
const COOLDOWN_SECS = 60;

function maskPhone(phone: string): string {
  if (!phone) return 'your phone number';
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.length <= 6) return cleaned;
  const last3  = cleaned.slice(-3);
  const prefix = cleaned.slice(0, Math.max(4, cleaned.length - 7));
  const stars  = '•'.repeat(Math.max(3, cleaned.length - prefix.length - 3));
  return `${prefix} ${stars} ${last3}`;
}

export default function VerifyPhonePage() {
  const router = useRouter();

  const [otp,            setOtp]            = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [phone,          setPhone]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [cooldown,       setCooldown]       = useState(0);
  const [resendCount,    setResendCount]    = useState(0);
  const [resending,      setResending]      = useState(false);
  const [phoneUnavailable, setPhoneUnavailable] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null));

  // Get phone number from session metadata
  useEffect(() => {
    async function loadSession() {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.phone) {
        setPhone(session.user.user_metadata.phone as string);
      }
      setSessionLoading(false);
    }
    loadSession();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Auto-submit when all boxes filled
  useEffect(() => {
    if (otp.every(d => d !== '')) {
      handleVerify(otp.join(''));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp];
        next[index] = '';
        setOtp(next);
      } else if (index > 0) {
        const next = [...otp];
        next[index - 1] = '';
        setOtp(next);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleVerify(token: string) {
    if (!phone || loading) return;
    setLoading(true);
    setError('');

    const supabase = getSupabaseClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    setLoading(false);
    if (verifyError) {
      setError('Invalid code. Please check and try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } else {
      router.replace('/auth/onboarding');
    }
  }

  async function handleResend() {
    if (!phone || cooldown > 0 || resending) return;
    setResending(true);
    setError('');

    const supabase = getSupabaseClient();
    const { error: resendError } = await supabase.auth.signInWithOtp({ phone });

    setResending(false);
    if (resendError) {
      if (
        resendError.message.toLowerCase().includes('provider') ||
        resendError.message.toLowerCase().includes('not enabled') ||
        resendError.message.toLowerCase().includes('twilio') ||
        resendError.message.toLowerCase().includes('sms')
      ) {
        setPhoneUnavailable(true);
      } else {
        setError('Could not send the code. Please try again.');
      }
    } else {
      setResendCount(c => c + 1);
      setCooldown(COOLDOWN_SECS);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  }

  function handleManualVerify(e: React.FormEvent) {
    e.preventDefault();
    const token = otp.join('');
    if (token.length === OTP_LENGTH) handleVerify(token);
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

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
              <Phone className="w-8 h-8 text-brand-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
            Verify your phone
          </h1>

          {phoneUnavailable ? (
            /* Phone auth not configured */
            <div className="mt-6 text-center space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm px-4 py-4 rounded-xl">
                Phone verification is temporarily unavailable. You can add your phone number from your profile settings.
              </div>
              <button
                onClick={() => router.replace('/auth/onboarding')}
                className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors"
              >
                Continue to your account
              </button>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                Enter the 6-digit code sent to{' '}
                <strong className="text-gray-900 dark:text-white font-medium">
                  {maskPhone(phone)}
                </strong>
              </p>

              {/* Error */}
              {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* OTP boxes */}
              <form onSubmit={handleManualVerify}>
                <div className="mt-6 flex justify-center gap-2 sm:gap-3">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      className={cn(
                        'w-11 h-14 sm:w-12 sm:h-16 text-center text-xl font-bold border-2 rounded-xl',
                        'focus:outline-none transition-all bg-white dark:bg-gray-800 dark:text-white',
                        digit
                          ? 'border-brand-400 ring-2 ring-brand-100 dark:ring-brand-900/40'
                          : 'border-gray-200 dark:border-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
                      )}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={otp.some(d => !d) || loading}
                  className="mt-6 w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:bg-brand-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              {/* Resend */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="text-sm text-brand-600 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                >
                  {resending && <Loader2 className="w-3 h-3 animate-spin" />}
                  {resending
                    ? 'Sending...'
                    : cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : resendCount > 0
                    ? 'Resend code'
                    : 'Send code again'}
                </button>
              </div>

              {/* Skip */}
              <div className="mt-3 text-center">
                <Link
                  href="/auth/onboarding"
                  className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Skip for now
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
