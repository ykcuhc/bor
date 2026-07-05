'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { getSupabaseClient } from '@/lib/supabase/client';

interface UserMeta {
  firstName: string;
  username: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser]       = useState<UserMeta | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/');
        return;
      }

      const meta = session.user.user_metadata ?? {};
      setUser({
        firstName: (meta.first_name as string) || (meta.display_name as string)?.split(' ')[0] || 'there',
        username:  (meta.username  as string) || '',
      });
      setChecking(false);
    }

    loadSession();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      {/* Keyframe styles for the animated checkmark */}
      <style>{`
        @keyframes draw-circle {
          from { stroke-dashoffset: 283; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes draw-check {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0;   }
        }
        .animate-draw-circle {
          stroke-dasharray: 283;
          stroke-dashoffset: 283;
          animation: draw-circle 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
        }
        .animate-draw-check {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: draw-check 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.8s forwards;
        }
      `}</style>

      <div className="w-full max-w-md text-center">

        {/* Logo */}
        <Link href="/" className="inline-flex justify-center mb-8">
          <Logo size="lg" />
        </Link>

        {/* Animated checkmark */}
        <div className="flex justify-center mb-8">
          <svg
            viewBox="0 0 100 100"
            className="w-28 h-28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background circle */}
            <circle cx="50" cy="50" r="46" className="text-brand-50 dark:text-brand-900/30" fill="currentColor" />
            {/* Animated border circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-brand-600 animate-draw-circle"
              style={{ transformOrigin: '50px 50px', transform: 'rotate(-90deg)' }}
            />
            {/* Animated checkmark */}
            <polyline
              points="26,52 42,66 74,34"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand-600 animate-draw-check"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          You&apos;re all set, {user?.firstName}! 🎉
        </h1>

        {/* Subtext */}
        <p className="mt-3 text-gray-500 dark:text-gray-400 text-base leading-relaxed">
          Your Miova account is ready. Start exploring Kuwait&apos;s marketplace.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/search"
            className="px-8 py-3.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors text-sm"
          >
            Start Shopping
          </Link>
          {user?.username && (
            <Link
              href={`/closet/${user.username}`}
              className="px-8 py-3.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              Complete your profile
            </Link>
          )}
          {!user?.username && (
            <Link
              href="/closet"
              className="px-8 py-3.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              Complete your profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
