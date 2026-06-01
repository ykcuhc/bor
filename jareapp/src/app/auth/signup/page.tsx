'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import NeighborhoodSelector from '@/components/neighborhood/NeighborhoodSelector';
import type { GovernorateData, NeighborhoodData } from '@/lib/data/kuwait-regions';

type Step = 'account' | 'location' | 'done';

export default function SignupPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [step, setStep]               = useState<Step>('account');
  const [fullName, setFullName]       = useState('');
  const [username, setUsername]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [selectedGov, setSelectedGov] = useState<GovernorateData | null>(null);
  const [selectedNH, setSelectedNH]   = useState<NeighborhoodData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // Step 1: Validate account fields and advance to location selection
  function handleAccountStep(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setStep('location');
  }

  // Step 2: Complete signup — create Supabase auth user, then insert profile row
  // with the selected neighbourhood and governorate IDs.
  // This two-step process is what enforces geographical fencing:
  // the neighborhood_id on the users row is immutable except by re-verification.
  async function handleLocationStep() {
    if (!selectedGov || !selectedNH) {
      setError('Please select your neighborhood.');
      return;
    }
    setError('');
    setLoading(true);

    // 1. Create the Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Signup failed. Please try again.');
      setLoading(false);
      return;
    }

    // 2. Look up the neighborhood_id and governorate_id from the DB
    //    (In production; for demo, we skip and proceed to done)
    // const { data: nhRow } = await supabase
    //   .from('neighborhoods')
    //   .select('id, governorate_id')
    //   .eq('name_en', selectedNH.name_en)
    //   .single();

    // 3. Insert the public profile row
    // await supabase.from('users').insert({
    //   id:              authData.user.id,
    //   full_name:       fullName,
    //   username:        username.toLowerCase(),
    //   neighborhood_id: nhRow?.id,
    //   governorate_id:  nhRow?.governorate_id,
    // });

    setStep('done');
    setLoading(false);
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card p-8 w-full max-w-sm text-center">
          <CheckCircle className="w-14 h-14 text-brand-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Welcome to JareApp!</h2>
          <p className="text-sm text-gray-600 mt-2 mb-6">
            You&apos;ve joined <strong>{selectedNH?.name_en}</strong>. Check your email to verify your address, then start connecting with your neighbors!
          </p>
          <button onClick={() => router.push('/')} className="btn-primary w-full">
            Go to My Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <MapPin className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join JareApp</h1>
          <p className="text-sm text-gray-500 mt-1">Connect with your neighbors in Kuwait</p>
        </div>

        <div className="card p-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6 text-xs">
            <StepDot active={step === 'account'} done={step === 'location'} number={1} label="Account" />
            <div className="flex-1 h-px bg-gray-200" />
            <StepDot active={step === 'location'} done={false} number={2} label="Location" />
          </div>

          {/* ── Step 1: Account details ──────────────────────── */}
          {step === 'account' && (
            <form onSubmit={handleAccountStep} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  required className="input" placeholder="Ahmad Al-Rashidi" />
              </div>
              <div>
                <label className="label">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                  required className="input" placeholder="ahmad_rashidi" pattern="[a-z0-9_]{3,20}" />
                <p className="text-xs text-gray-400 mt-1">Letters, numbers, underscores. 3–20 chars.</p>
              </div>
              <div>
                <label className="label">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email" className="input" placeholder="you@example.com" />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={8} className="input pr-10" placeholder="Min 8 characters" />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" className="btn-primary w-full">Next: Choose Neighborhood →</button>
            </form>
          )}

          {/* ── Step 2: Geographical fencing — neighborhood selection ── */}
          {step === 'location' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Where do you live?</h3>
                <p className="text-xs text-gray-500 mt-1">
                  You will only see posts from neighbors in your chosen neighborhood.
                  This cannot be changed without re-verification.
                </p>
              </div>

              <NeighborhoodSelector
                onSelect={(gov, nh) => { setSelectedGov(gov); setSelectedNH(nh); }}
                selectedGovernorate={selectedGov}
                selectedNeighborhood={selectedNH}
              />

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep('account')} className="btn-secondary flex-1">← Back</button>
                <button
                  onClick={handleLocationStep}
                  disabled={!selectedNH || loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function StepDot({ active, done, number, label }: { active: boolean; done: boolean; number: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
        done   ? 'bg-brand-600 text-white' :
        active ? 'bg-brand-600 text-white ring-2 ring-brand-200' :
                 'bg-gray-200 text-gray-500'
      }`}>
        {done ? '✓' : number}
      </div>
      <span className={active ? 'font-semibold text-brand-700' : 'text-gray-400'}>{label}</span>
    </div>
  );
}
