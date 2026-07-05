'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabase/client';

// ─── Constants ────────────────────────────────────────────────────────────────

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
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+92',  flag: '🇵🇰', name: 'Pakistan' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
] as const;

const PASSWORD_RULES = [
  { label: 'At least 8 characters',  test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',    test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',    test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number',             test: (p: string) => /\d/.test(p) },
  { label: 'One special character',  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH_SEGMENT_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
const STRENGTH_TEXT_COLORS    = ['', 'text-red-600', 'text-orange-500', 'text-yellow-600', 'text-lime-600', 'text-green-600'];
const STRENGTH_LABELS         = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

function getDobLimits() {
  const today = new Date();
  const max   = new Date(today.getFullYear() - 13,  today.getMonth(), today.getDate());
  const min   = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  return {
    max: max.toISOString().split('T')[0],
    min: min.toISOString().split('T')[0],
  };
}

const DOB_LIMITS = getDobLimits();

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateName(value: string, label: string): string | undefined {
  const v = value.trim();
  if (!v) return `${label} is required`;
  if (v.length < 2)  return `${label} must be at least 2 characters`;
  if (v.length > 50) return `${label} must be at most 50 characters`;
  if (!/^[a-zA-Z\s-]+$/.test(v)) return `${label} may only contain letters, spaces, and hyphens`;
}

function validateUsername(value: string): string | undefined {
  if (!value)         return 'Username is required';
  if (value.length < 3)  return 'Must be at least 3 characters';
  if (value.length > 20) return 'Must be at most 20 characters';
  if (!/^[a-zA-Z0-9_.]+$/.test(value)) return 'Only letters, numbers, _ and . allowed';
  if (value.startsWith('.') || value.endsWith('.')) return 'Cannot start or end with a period';
  if (/\.\./.test(value))                           return 'Cannot contain consecutive periods';
}

function validateEmail(value: string): string | undefined {
  if (!value) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
}

function validatePhone(value: string): string | undefined {
  if (!value.trim()) return 'Phone number is required';
  const digits = value.replace(/[\s\-()]/g, '');
  if (!/^\d{5,15}$/.test(digits)) return 'Please enter a valid phone number';
}

function validatePassword(value: string): string | undefined {
  if (!value)         return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
}

function validateConfirmPassword(pw: string, confirm: string): string | undefined {
  if (!confirm)   return 'Please confirm your password';
  if (pw !== confirm) return 'Passwords do not match';
}

function validateDob(value: string): string | undefined {
  if (!value) return 'Date of birth is required';
  const dob     = new Date(value);
  const [y, m, d] = DOB_LIMITS.max.split('-').map(Number);
  const maxDate = new Date(y, m - 1, d);
  if (dob > maxDate) return 'You must be at least 13 years old to register';
}

// ─── Shared sub-component ─────────────────────────────────────────────────────

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {error}
    </p>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  countryCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dob: string;
  language: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

type FieldErrors = Partial<{
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  dob: string;
}>;

const VALIDATABLE_FIELDS = ['firstName', 'lastName', 'username', 'email', 'phone', 'password', 'confirmPassword', 'dob'] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    firstName:       '',
    lastName:        '',
    username:        '',
    email:           '',
    countryCode:     '+965',
    phone:           '',
    password:        '',
    confirmPassword: '',
    dob:             '',
    language:        'en',
    agreeTerms:      false,
    agreePrivacy:    false,
  });

  const [errors,       setErrors]       = useState<FieldErrors>({});
  const [touched,      setTouched]      = useState<Partial<Record<string, boolean>>>({});
  const [loading,      setLoading]      = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const passwordStrength = PASSWORD_RULES.filter(r => r.test(form.password)).length;
  const isRTL            = form.language === 'ar';

  // ── Browser language detection ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('ar')) {
      setForm(prev => ({ ...prev, language: 'ar' }));
    }
  }, []);

  // ── Debounced username availability check ──────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!form.username) {
      setUsernameStatus('idle');
      return;
    }

    const fmtErr = validateUsername(form.username);
    if (fmtErr) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/auth/check-username?username=${encodeURIComponent(form.username)}`);
        const data = await res.json() as { available?: boolean };
        if (res.ok) {
          setUsernameStatus(data.available ? 'available' : 'taken');
        } else {
          setUsernameStatus('invalid');
        }
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.username]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function validateField(field: string): string | undefined {
    switch (field) {
      case 'firstName':       return validateName(form.firstName, 'First name');
      case 'lastName':        return validateName(form.lastName,  'Last name');
      case 'username':        return validateUsername(form.username);
      case 'email':           return validateEmail(form.email);
      case 'phone':           return validatePhone(form.phone);
      case 'password':        return validatePassword(form.password);
      case 'confirmPassword': return validateConfirmPassword(form.password, form.confirmPassword);
      case 'dob':             return validateDob(form.dob);
      default:                return undefined;
    }
  }

  function handleBlur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field) }));
  }

  function validateAll(): FieldErrors {
    return {
      firstName:       validateName(form.firstName, 'First name'),
      lastName:        validateName(form.lastName,  'Last name'),
      username:        validateUsername(form.username),
      email:           validateEmail(form.email),
      phone:           validatePhone(form.phone),
      password:        validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
      dob:             validateDob(form.dob),
    };
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Mark everything touched
    const allTouched: Partial<Record<string, boolean>> = {};
    VALIDATABLE_FIELDS.forEach(f => { allTouched[f] = true; });
    setTouched(allTouched);

    const allErrors = validateAll();
    setErrors(allErrors);

    const hasErrors = Object.values(allErrors).some(Boolean);
    if (hasErrors) {
      const firstErrField = VALIDATABLE_FIELDS.find(f => allErrors[f]);
      if (firstErrField) {
        document.getElementById(firstErrField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (usernameStatus === 'taken') {
      setErrors(prev => ({ ...prev, username: 'This username is already taken' }));
      document.getElementById('username')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (usernameStatus === 'checking') return;

    setLoading(true);
    setNetworkError('');

    const supabase = getSupabaseClient();

    try {
      const { error } = await supabase.auth.signUp({
        email:    form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username:           form.username,
            display_name:       `${form.firstName.trim()} ${form.lastName.trim()}`,
            first_name:         form.firstName.trim(),
            last_name:          form.lastName.trim(),
            phone:              form.countryCode + form.phone.replace(/[\s\-()]/g, ''),
            dob:                form.dob,
            preferred_language: form.language,
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email') && (msg.includes('already') || msg.includes('registered') || msg.includes('exists'))) {
          setErrors(prev => ({ ...prev, email: 'An account with this email already exists' }));
          setTouched(prev => ({ ...prev, email: true }));
          document.getElementById('email')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setNetworkError('Something went wrong. Please try again.');
        }
        setLoading(false);
        return;
      }

      router.push(`/auth/verify-email?email=${encodeURIComponent(form.email.trim())}`);
    } catch {
      setNetworkError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  }

  // ── Input styling ──────────────────────────────────────────────────────────

  function inputCls(field: string, extra?: string) {
    const hasError   = touched[field] && errors[field as keyof FieldErrors];
    const hasSuccess = touched[field] && !errors[field as keyof FieldErrors] && !!(form as unknown as Record<string, unknown>)[field];
    return cn(
      'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-all',
      'bg-white dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500',
      hasError
        ? 'border-red-400 ring-2 ring-red-100 dark:ring-red-900/40'
        : hasSuccess
        ? 'border-green-400 ring-2 ring-green-100 dark:ring-green-900/40'
        : 'border-gray-200 dark:border-gray-700 focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
      extra,
    );
  }

  const canSubmit = form.agreeTerms && form.agreePrivacy && usernameStatus !== 'checking' && !loading;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen md:flex">

      {/* ── Left brand panel (desktop only) ── */}
      <aside
        aria-hidden="true"
        className="hidden md:flex md:w-2/5 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-800 to-brand-700"
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-20 right-8 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />

        {/* Top content */}
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

        {/* Bottom SVG illustration */}
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
      </aside>

      {/* ── Right form panel ── */}
      <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-start py-10 px-4 sm:px-8">

          {/* Mobile logo */}
          <div className="md:hidden mb-6 text-center">
            <Link href="/" className="inline-flex justify-center">
              <Logo size="lg" />
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Kuwait&apos;s Marketplace for Everything
            </p>
          </div>

          <div className="w-full max-w-lg">
            {/* Desktop heading */}
            <div className="hidden md:block mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create your account
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Join thousands of buyers and sellers on Miova
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">

              {/* Network error banner */}
              {networkError && (
                <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {networkError}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
                dir={isRTL ? 'rtl' : 'ltr'}
                noValidate
              >

                {/* ── First + Last name ── */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={e => update('firstName', e.target.value)}
                      onBlur={() => handleBlur('firstName')}
                      placeholder="Layla"
                      className={inputCls('firstName')}
                    />
                    <FieldError error={touched.firstName ? errors.firstName : undefined} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={e => update('lastName', e.target.value)}
                      onBlur={() => handleBlur('lastName')}
                      placeholder="Al-Ahmad"
                      className={inputCls('lastName')}
                    />
                    <FieldError error={touched.lastName ? errors.lastName : undefined} />
                  </div>
                </div>

                {/* ── Username ── */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className={cn(
                      'absolute top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none pointer-events-none',
                      isRTL ? 'right-4' : 'left-4',
                    )}>
                      @
                    </span>
                    <input
                      id="username"
                      type="text"
                      autoComplete="username"
                      value={form.username}
                      onChange={e => update('username', e.target.value.toLowerCase())}
                      onBlur={() => handleBlur('username')}
                      placeholder="layla_q8"
                      className={cn(inputCls('username'), isRTL ? 'pr-8' : 'pl-8')}
                    />
                  </div>

                  {/* Availability indicator */}
                  {form.username ? (
                    <div className="mt-1 flex items-center gap-1 text-xs h-4">
                      {usernameStatus === 'checking' && (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                          <span className="text-gray-400">Checking availability…</span>
                        </>
                      )}
                      {usernameStatus === 'available' && (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span className="text-green-600 dark:text-green-400 font-medium">Available</span>
                        </>
                      )}
                      {usernameStatus === 'taken' && (
                        <>
                          <XCircle className="w-3 h-3 text-red-500" />
                          <span className="text-red-600 font-medium">Taken</span>
                        </>
                      )}
                    </div>
                  ) : null}

                  <FieldError error={touched.username ? errors.username : undefined} />
                </div>

                {/* ── Email ── */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="you@example.com"
                    className={inputCls('email')}
                  />
                  <FieldError error={touched.email ? errors.email : undefined} />
                </div>

                {/* ── Mobile Number ── */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    {/* Country code */}
                    <select
                      value={form.countryCode}
                      onChange={e => update('countryCode', e.target.value)}
                      className={cn(
                        'px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm',
                        'focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all',
                        'bg-white dark:bg-gray-800 dark:text-white shrink-0',
                        isRTL ? 'w-32' : 'w-28',
                      )}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    {/* Number */}
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      placeholder="5X XXX XXXX"
                      className={cn(inputCls('phone'), 'flex-1')}
                    />
                  </div>
                  <FieldError error={touched.phone ? errors.phone : undefined} />
                </div>

                {/* ── Password ── */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      placeholder="Create a strong password"
                      className={cn(inputCls('password'), isRTL ? 'pl-11' : 'pr-11')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors',
                        isRTL ? 'left-3' : 'right-3',
                      )}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {form.password && (
                    <div className="mt-2">
                      {/* 5-segment bar */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className={cn(
                              'h-1.5 flex-1 rounded-full transition-all',
                              i <= passwordStrength
                                ? STRENGTH_SEGMENT_COLORS[passwordStrength]
                                : 'bg-gray-200 dark:bg-gray-700',
                            )}
                          />
                        ))}
                      </div>
                      {passwordStrength > 0 && (
                        <p className={cn('text-xs mt-1 font-medium', STRENGTH_TEXT_COLORS[passwordStrength])}>
                          {STRENGTH_LABELS[passwordStrength]}
                        </p>
                      )}
                      {/* Rule checklist */}
                      <ul className="mt-2 space-y-1">
                        {PASSWORD_RULES.map(rule => {
                          const passed = rule.test(form.password);
                          return (
                            <li key={rule.label} className="flex items-center gap-2 text-xs">
                              {passed ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                              )}
                              <span className={passed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}>
                                {rule.label}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  <FieldError error={touched.password ? errors.password : undefined} />
                </div>

                {/* ── Confirm Password ── */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      placeholder="Repeat your password"
                      className={cn(inputCls('confirmPassword'), isRTL ? 'pl-11' : 'pr-11')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(p => !p)}
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors',
                        isRTL ? 'left-3' : 'right-3',
                      )}
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldError error={touched.confirmPassword ? errors.confirmPassword : undefined} />
                </div>

                {/* ── Date of Birth ── */}
                <div>
                  <label htmlFor="dob" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    id="dob"
                    type="date"
                    value={form.dob}
                    onChange={e => update('dob', e.target.value)}
                    onBlur={() => handleBlur('dob')}
                    max={DOB_LIMITS.max}
                    min={DOB_LIMITS.min}
                    className={inputCls('dob')}
                  />
                  <FieldError error={touched.dob ? errors.dob : undefined} />
                </div>

                {/* ── Preferred Language ── */}
                <div>
                  <label htmlFor="language" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Preferred Language
                  </label>
                  <select
                    id="language"
                    value={form.language}
                    onChange={e => update('language', e.target.value)}
                    className={cn(
                      'w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm',
                      'focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all',
                      'bg-white dark:bg-gray-800 dark:text-white',
                    )}
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>

                {/* ── Terms & Privacy ── */}
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.agreeTerms}
                      onChange={e => update('agreeTerms', e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 select-none">
                      I agree to the{' '}
                      <Link href="/terms" className="text-brand-600 hover:underline font-medium" target="_blank" rel="noopener">
                        Terms of Service
                      </Link>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.agreePrivacy}
                      onChange={e => update('agreePrivacy', e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 select-none">
                      I agree to the{' '}
                      <Link href="/privacy" className="text-brand-600 hover:underline font-medium" target="_blank" rel="noopener">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                {/* ── Submit ── */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:bg-brand-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              {/* Sign-in link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-semibold text-brand-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
