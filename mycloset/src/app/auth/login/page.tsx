'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye, EyeOff, Loader2, AlertCircle, Mail, User, Phone,
  Shield, ChevronRight, ArrowLeft, RefreshCw,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';

// ─── Module-level rate-limit state ──────────────────────────────────────────
// Resets on page reload — provides a meaningful deterrent without server infra.

let _attempts  = 0;
let _lockUntil = 0;

function isCurrentlyLocked() { return _lockUntil > Date.now(); }
function remainingLockMs()   { return Math.max(0, _lockUntil - Date.now()); }
function recordFailure() {
  _attempts++;
  if      (_attempts >= 7) _lockUntil = Date.now() + 15 * 60_000;
  else if (_attempts >= 5) _lockUntil = Date.now() + 5  * 60_000;
  else if (_attempts >= 3) _lockUntil = Date.now() + 30_000;
}
function clearAttempts() { _attempts = 0; _lockUntil = 0; }

// ─── Identifier helpers ───────────────────────────────────────────────────────

type IdentifierType = 'email' | 'username' | 'phone';

function detectType(value: string): IdentifierType {
  const v = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'email';
  if (/^[+\d][\d\s\-()+]{4,}$/.test(v))     return 'phone';
  return 'username';
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1.5">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {error}
    </p>
  );
}

// ─── Lockout countdown banner ─────────────────────────────────────────────────

function LockoutBanner({ initialMs, onExpire }: { initialMs: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(Math.ceil(initialMs / 1000));
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (remaining <= 0) { onExpireRef.current(); return; }
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(id); onExpireRef.current(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const label = mins > 0
    ? `${mins}m ${String(secs).padStart(2, '0')}s`
    : `${secs}s`;

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3.5 flex items-start gap-3">
      <Shield className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Too many failed attempts</p>
        <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">
          Please wait{' '}
          <span className="font-mono font-bold">{label}</span>{' '}
          before trying again.
        </p>
      </div>
    </div>
  );
}

// ─── Email-unverified state ───────────────────────────────────────────────────

function EmailUnverifiedView({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const [countdown,  setCountdown]  = useState(0);
  const [attempts,   setAttempts]   = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [sent,       setSent]       = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  async function resend() {
    if (loading || countdown > 0 || attempts >= 3) return;
    setLoading(true);
    const supabase = getSupabaseClient();
    await supabase.auth.resend({ type: 'signup', email });
    setLoading(false);
    setAttempts(a => a + 1);
    setCountdown(60);
    setSent(true);
  }

  const canResend = !loading && countdown === 0 && attempts < 3;

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <Mail className="w-8 h-8 text-amber-500" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Verify your email first
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Your account is registered but not yet verified.
        </p>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
          {email}
        </p>

        {sent && (
          <div className="mb-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm px-4 py-3 rounded-xl">
            Verification email sent — check your inbox.
          </div>
        )}

        <div className="space-y-3">
          <Link
            href={`/auth/verify-email?email=${encodeURIComponent(email)}`}
            className="block w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Go to verification page
          </Link>

          <button
            type="button"
            onClick={resend}
            disabled={!canResend}
            className="w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {countdown > 0 ? `Resend in ${countdown}s` :
             attempts >= 3 ? 'Resend limit reached' :
             'Resend verification email'}
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1.5 mx-auto transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </button>
      </div>
    </div>
  );
}

// ─── Account issue state ──────────────────────────────────────────────────────

function AccountIssueView({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
          <Shield className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Account restricted
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          If you believe this is a mistake, please contact our support team.
        </p>

        <div className="space-y-3">
          <Link
            href="mailto:support@miova.app"
            className="block w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Contact support
          </Link>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Phone OTP flow ───────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+1',   flag: '🇺🇸', name: 'USA' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
] as const;

function PhoneOtpFlow({
  initialPhone,
  onBack,
  redirectTo,
}: {
  initialPhone: string;
  onBack: () => void;
  redirectTo: string;
}) {
  const router = useRouter();
  const { initAuth, showToast } = useStore();

  // Parse the initial phone if it looks like a full number
  const [countryCode, setCountryCode] = useState('+965');
  const [phone,       setPhone]       = useState(initialPhone.startsWith('+') ? initialPhone : '');
  const [step,        setStep]        = useState<'phone' | 'otp' | 'unavailable'>('phone');
  const [otp,         setOtp]         = useState(['', '', '', '', '', '']);
  const [fullPhone,   setFullPhone]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [countdown,   setCountdown]   = useState(0);

  const otpRefs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  async function sendOtp() {
    setError('');
    setLoading(true);
    const number = countryCode + phone.replace(/[\s\-()]/g, '');
    const supabase = getSupabaseClient();
    const { error: err } = await supabase.auth.signInWithOtp({ phone: number });
    setLoading(false);

    if (err) {
      if (err.message.toLowerCase().includes('sms') || err.message.toLowerCase().includes('phone')) {
        setStep('unavailable');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
      return;
    }

    setFullPhone(number);
    setStep('otp');
    setCountdown(60);
    setTimeout(() => otpRefs[0].current?.focus(), 100);
  }

  async function verifyOtp() {
    const code = otp.join('');
    if (code.length < 6) return;
    setError('');
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: fullPhone,
      token: code,
      type:  'sms',
    });
    setLoading(false);

    if (err || !data.session) {
      setError('Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs[0].current?.focus();
      return;
    }

    clearAttempts();
    await initAuth();
    showToast('Welcome back!', 'success');
    router.push(redirectTo.startsWith('/') ? redirectTo : '/');
  }

  function handleOtpInput(idx: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[idx]   = char;
    setOtp(next);
    if (char && idx < 5) otpRefs[idx + 1].current?.focus();
    if (next.every(c => c !== '')) {
      setTimeout(() => verifyOtp(), 50);
    }
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs[idx - 1].current?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const next = [...otp];
    digits.split('').forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    const focusIdx = Math.min(digits.length, 5);
    otpRefs[focusIdx].current?.focus();
    if (digits.length === 6) setTimeout(() => verifyOtp(), 50);
  }

  if (step === 'unavailable') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <Phone className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Phone login unavailable</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            SMS verification is temporarily unavailable. Please sign in with your email or username instead.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <button type="button" onClick={() => setStep('phone')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Change number
          </button>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Enter the code</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Sent to <span className="font-medium text-gray-700 dark:text-gray-300">{fullPhone}</span>
          </p>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={otpRefs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpInput(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                aria-label={`OTP digit ${i + 1}`}
                className={cn(
                  'w-11 h-13 text-center text-lg font-bold border rounded-xl',
                  'focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all',
                  'bg-white dark:bg-gray-700 dark:text-white',
                  digit ? 'border-brand-400 dark:border-brand-500' : 'border-gray-200 dark:border-gray-600',
                )}
                style={{ height: '3.25rem' }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={verifyOtp}
            disabled={loading || otp.some(c => c === '')}
            className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:bg-brand-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={sendOtp}
              disabled={countdown > 0 || loading}
              className="text-sm text-brand-600 hover:underline disabled:opacity-50 disabled:no-underline transition-opacity"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // step === 'phone'
  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Sign in with phone</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          We'll send a one-time code to your mobile number.
        </p>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Mobile number
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              className="px-3 py-3 w-28 shrink-0 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 bg-white dark:bg-gray-800 dark:text-white transition-all"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="5X XXX XXXX"
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 bg-white dark:bg-gray-800 dark:text-white transition-all"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={sendOtp}
          disabled={loading || !phone.trim()}
          className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:bg-brand-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Sending…' : 'Send code'}
        </button>
      </div>
    </div>
  );
}

// ─── Main login form (needs Suspense for useSearchParams) ────────────────────

function LoginForm() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const redirectTo  = searchParams.get('redirect') ?? '/';

  const { initAuth, showToast } = useStore();

  // Form values
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPw,     setShowPw]     = useState(false);
  const [lang,       setLang]       = useState<'en' | 'ar'>('en');
  const isRTL = lang === 'ar';

  // Touch + error state
  const [idTouched, setIdTouched] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [idError,   setIdError]   = useState<string | undefined>();
  const [pwError,   setPwError]   = useState<string | undefined>();

  // Submission state
  const [loading,    setLoading]   = useState(false);
  const [authError,  setAuthError] = useState<string | undefined>();
  const [locked,     setLocked]    = useState(isCurrentlyLocked);
  const [lockMs,     setLockMs]    = useState(remainingLockMs);

  // Special states
  type ViewState = 'form' | 'email_unverified' | 'account_issue' | 'phone_otp';
  const [view,             setView]             = useState<ViewState>('form');
  const [unverifiedEmail,  setUnverifiedEmail]  = useState('');
  const [accountIssueMsg,  setAccountIssueMsg]  = useState('');
  const [detectedPhone,    setDetectedPhone]    = useState('');

  // Detect browser language
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('ar')) {
      setLang('ar');
    }
  }, []);

  // Load remembered identifier
  useEffect(() => {
    try {
      const saved = localStorage.getItem('miova_login_identifier');
      if (saved) { setIdentifier(saved); setRememberMe(true); }
    } catch {}
  }, []);

  // Monitor lock expiry
  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => {
      if (!isCurrentlyLocked()) { setLocked(false); setLockMs(0); }
    }, 500);
    return () => clearInterval(id);
  }, [locked]);

  const identType = detectType(identifier);

  const identIconMap: Record<IdentifierType, React.ReactNode> = {
    email:    <Mail  className="w-4 h-4 text-gray-400" />,
    username: <User  className="w-4 h-4 text-gray-400" />,
    phone:    <Phone className="w-4 h-4 text-gray-400" />,
  };

  function validateId(v: string): string | undefined {
    if (!v.trim()) return 'Please enter your email, username, or phone number';
  }

  function validatePw(v: string): string | undefined {
    if (!v) return 'Password is required';
  }

  // Resolve identifier → canonical email for password auth
  async function resolveToEmail(id: string): Promise<string | null> {
    if (detectType(id) === 'email') return id.trim();
    try {
      const res  = await fetch(`/api/auth/resolve-identifier?identifier=${encodeURIComponent(id.trim())}`);
      const data = await res.json() as { email?: string | null };
      return data.email ?? null;
    } catch {
      return null;
    }
  }

  const handleLockExpire = useCallback(() => {
    setLocked(false);
    setLockMs(0);
    setAuthError(undefined);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(undefined);

    // Guard: lock
    if (isCurrentlyLocked()) {
      setLocked(true);
      setLockMs(remainingLockMs());
      return;
    }

    // Validate
    const ie = validateId(identifier);
    const pe = validatePw(password);
    setIdTouched(true); setPwTouched(true);
    setIdError(ie); setPwError(pe);
    if (ie || pe) return;

    // Phone → OTP flow
    if (identType === 'phone') {
      setDetectedPhone(identifier.trim());
      setView('phone_otp');
      return;
    }

    setLoading(true);

    try {
      const email = await resolveToEmail(identifier);

      if (!email) {
        // Username not found — treat as invalid credentials to avoid enumeration
        recordFailure();
        if (isCurrentlyLocked()) {
          setLocked(true);
          setLockMs(remainingLockMs());
        } else {
          setAuthError('Invalid credentials. Please check and try again.');
        }
        setLoading(false);
        return;
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        const msg  = error.message.toLowerCase();
        const code = (error as { code?: string }).code ?? '';

        // Email not confirmed
        if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
          setUnverifiedEmail(email);
          setLoading(false);
          setView('email_unverified');
          return;
        }

        // Account banned / suspended / deleted
        if (
          msg.includes('banned')      ||
          msg.includes('suspended')   ||
          msg.includes('deactivated') ||
          msg.includes('deleted')
        ) {
          setAccountIssueMsg(
            msg.includes('banned')      ? 'Your account has been permanently banned due to policy violations.' :
            msg.includes('suspended')   ? 'Your account has been temporarily suspended. Please contact support.' :
            msg.includes('deactivated') ? 'This account has been deactivated.' :
                                          'This account no longer exists.',
          );
          setLoading(false);
          setView('account_issue');
          return;
        }

        // Generic invalid credentials (never disclose which field was wrong)
        recordFailure();
        if (isCurrentlyLocked()) {
          setLocked(true);
          setLockMs(remainingLockMs());
        } else {
          const remaining = 3 - _attempts;
          setAuthError(
            remaining > 0
              ? `Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
              : 'Invalid credentials. Please check and try again.',
          );
        }
        setLoading(false);
        return;
      }

      if (!data.session || !data.user) {
        setAuthError('Sign-in failed. Please try again.');
        setLoading(false);
        return;
      }

      // Remember me
      try {
        if (rememberMe) localStorage.setItem('miova_login_identifier', identifier);
        else            localStorage.removeItem('miova_login_identifier');
      } catch {}

      // Hydrate store and redirect
      clearAttempts();
      await initAuth();
      showToast('Welcome back!', 'success');
      router.push(redirectTo.startsWith('/') ? redirectTo : '/');

    } catch {
      setAuthError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  // ── Special view routing ──────────────────────────────────────────────────

  if (view === 'email_unverified') {
    return (
      <EmailUnverifiedView
        email={unverifiedEmail}
        onBack={() => setView('form')}
      />
    );
  }

  if (view === 'account_issue') {
    return (
      <AccountIssueView
        message={accountIssueMsg}
        onBack={() => setView('form')}
      />
    );
  }

  if (view === 'phone_otp') {
    return (
      <PhoneOtpFlow
        initialPhone={detectedPhone}
        onBack={() => setView('form')}
        redirectTo={redirectTo}
      />
    );
  }

  // ── Normal form ───────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-md">

      {/* Mobile logo */}
      <div className="md:hidden mb-6 text-center">
        <Link href="/" className="inline-flex justify-center">
          <Logo size="lg" />
        </Link>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Kuwait&apos;s Marketplace for Everything
        </p>
      </div>

      {/* Desktop heading */}
      <div className="hidden md:block mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Sign in to your Miova account
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">

        {/* Lockout banner */}
        {locked && (
          <div className="mb-5">
            <LockoutBanner initialMs={lockMs} onExpire={handleLockExpire} />
          </div>
        )}

        {/* Auth error banner */}
        {authError && !locked && (
          <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          dir={isRTL ? 'rtl' : 'ltr'}
          noValidate
          autoComplete="on"
        >

          {/* ── Identifier ── */}
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Email, Username, or Phone
            </label>
            <div className="relative">
              <input
                id="identifier"
                name="username"
                type="text"
                autoComplete="username email"
                autoFocus
                value={identifier}
                onChange={e => {
                  setIdentifier(e.target.value);
                  setAuthError(undefined);
                  if (idTouched) setIdError(validateId(e.target.value));
                }}
                onBlur={() => {
                  setIdTouched(true);
                  setIdError(validateId(identifier));
                }}
                placeholder="you@example.com · username · +965…"
                className={cn(
                  'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-all',
                  'bg-white dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
                  isRTL ? 'pl-10' : 'pr-10',
                  idTouched && idError
                    ? 'border-red-400 ring-2 ring-red-100 dark:ring-red-900/40'
                    : idTouched && !idError && identifier
                    ? 'border-green-400 ring-2 ring-green-100 dark:ring-green-900/40'
                    : 'border-gray-200 dark:border-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
                )}
              />
              {identifier && (
                <div className={cn(
                  'absolute top-1/2 -translate-y-1/2 pointer-events-none',
                  isRTL ? 'left-3' : 'right-3',
                )}>
                  {identIconMap[identType]}
                </div>
              )}
            </div>

            {/* Phone-mode hint */}
            {identType === 'phone' && identifier && (
              <p className="mt-1.5 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                Phone detected.{' '}
                <button
                  type="button"
                  className="underline font-medium hover:no-underline"
                  onClick={() => { setDetectedPhone(identifier.trim()); setView('phone_otp'); }}
                >
                  Sign in with OTP
                </button>
              </p>
            )}

            <FieldError error={idTouched ? idError : undefined} />
          </div>

          {/* ── Password ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Password
              </label>
              <Link
                href="/auth/forgot"
                className="text-xs text-brand-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setAuthError(undefined);
                  if (pwTouched) setPwError(validatePw(e.target.value));
                }}
                onBlur={() => {
                  setPwTouched(true);
                  setPwError(validatePw(password));
                }}
                placeholder="Enter your password"
                className={cn(
                  'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-all',
                  'bg-white dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
                  isRTL ? 'pl-11' : 'pr-11',
                  pwTouched && pwError
                    ? 'border-red-400 ring-2 ring-red-100 dark:ring-red-900/40'
                    : 'border-gray-200 dark:border-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
                )}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors',
                  isRTL ? 'left-3' : 'right-3',
                )}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <FieldError error={pwTouched ? pwError : undefined} />
          </div>

          {/* ── Remember Me ── */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
          </label>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading || locked}
            className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</>
            ) : locked ? (
              'Please wait…'
            ) : (
              <>Sign In <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Register link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-semibold text-brand-600 hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────

function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">

      {/* ── Left brand panel (desktop only) ── */}
      <aside
        aria-hidden="true"
        className="hidden md:flex md:w-2/5 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700"
      >
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-20 right-8 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

        {/* Top */}
        <div className="relative z-10">
          <Link href="/">
            <Logo size="lg" invert />
          </Link>

          <h2 className="mt-10 text-3xl font-bold text-white leading-tight">
            Kuwait&apos;s Marketplace<br />for Everything
          </h2>

          <ul className="mt-10 space-y-6">
            {([
              { icon: '🛍️', title: 'Shop',      desc: 'Discover unique items from sellers across Kuwait' },
              { icon: '💰', title: 'Sell',       desc: 'List your items in minutes and reach thousands of buyers' },
              { icon: '🤝', title: 'Community',  desc: 'Join a trusted community of buyers and sellers' },
            ] as const).map(item => (
              <li key={item.title} className="flex gap-4 items-start">
                <span className="text-2xl mt-0.5 shrink-0">{item.icon}</span>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-white/70 mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom illustration */}
        <div className="relative z-10 mt-10">
          <svg viewBox="0 0 320 140" className="w-full opacity-20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8"   y="32"  width="88" height="100" rx="10" fill="white" />
            <rect x="116" y="12"  width="88" height="120" rx="10" fill="white" />
            <rect x="224" y="26"  width="88" height="106" rx="10" fill="white" />
            <rect x="20"  y="52"  width="64" height="36"  rx="6"  fill="white" opacity="0.4" />
            <rect x="128" y="32"  width="64" height="36"  rx="6"  fill="white" opacity="0.4" />
            <rect x="236" y="46"  width="64" height="36"  rx="6"  fill="white" opacity="0.4" />
            <rect x="20"  y="98"  width="44" height="6"   rx="3"  fill="white" opacity="0.6" />
            <rect x="128" y="78"  width="44" height="6"   rx="3"  fill="white" opacity="0.6" />
            <rect x="236" y="92"  width="44" height="6"   rx="3"  fill="white" opacity="0.6" />
            <rect x="20"  y="112" width="32" height="6"   rx="3"  fill="white" opacity="0.35" />
            <rect x="128" y="92"  width="32" height="6"   rx="3"  fill="white" opacity="0.35" />
            <rect x="236" y="106" width="32" height="6"   rx="3"  fill="white" opacity="0.35" />
          </svg>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10">
          <p className="text-xs text-white/40">© 2026 QuantumNet. · Kuwait.</p>
        </div>
      </aside>

      {/* ── Right content panel ── */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <LoginLayout>
      <Suspense fallback={
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </LoginLayout>
  );
}
