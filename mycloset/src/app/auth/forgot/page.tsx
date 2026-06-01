'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const { showToast }         = useStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      showToast(error.message, 'error');
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Reset your password</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {sent
              ? 'Check your inbox for the reset link.'
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">
                If <span className="font-medium">{email}</span> has an account, you'll receive a password reset link shortly.
              </p>
              <Link href="/auth/login" className="block text-sm text-brand-600 hover:underline font-medium">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send reset link
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
