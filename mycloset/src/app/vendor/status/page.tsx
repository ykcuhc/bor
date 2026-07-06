'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, CheckCircle2, XCircle, AlertCircle,
  FileSearch, ChevronRight, RefreshCw, Loader2,
  Store, Mail, MessageSquare, Info,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { ApplicationStatus } from '@/types/vendor';

interface ApplicationSummary {
  id: string;
  status: ApplicationStatus;
  storeName: string;
  storeUsername: string;
  vendorType: string;
  submittedAt: string | null;
  updatedAt: string | null;
  additionalInfoRequested: string | null;
  rejectionReason: string | null;
}

interface StatusConfig {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  title: string;
  description: string;
  nextStep?: string;
}

const STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  draft: {
    icon:        Clock,
    color:       'text-gray-500',
    bg:          'bg-gray-100 dark:bg-gray-800',
    border:      'border-gray-200 dark:border-gray-700',
    title:       'Draft',
    description: 'Your application has not been submitted yet.',
    nextStep:    'Continue your application to complete and submit it.',
  },
  submitted: {
    icon:        FileSearch,
    color:       'text-blue-500',
    bg:          'bg-blue-50 dark:bg-blue-900/20',
    border:      'border-blue-200 dark:border-blue-800',
    title:       'Application Submitted',
    description: 'We\'ve received your application and it is in the queue for review.',
    nextStep:    'Our team will begin reviewing it within 1–2 business days.',
  },
  pending_verification: {
    icon:        Clock,
    color:       'text-amber-500',
    bg:          'bg-amber-50 dark:bg-amber-900/20',
    border:      'border-amber-200 dark:border-amber-800',
    title:       'Pending Verification',
    description: 'Your identity and/or business documents are being verified.',
    nextStep:    'This typically takes 2–5 business days.',
  },
  under_review: {
    icon:        FileSearch,
    color:       'text-purple-500',
    bg:          'bg-purple-50 dark:bg-purple-900/20',
    border:      'border-purple-200 dark:border-purple-800',
    title:       'Under Review',
    description: 'Our team is actively reviewing your application.',
    nextStep:    'You will be notified within 1–3 business days.',
  },
  additional_info_required: {
    icon:        AlertCircle,
    color:       'text-orange-500',
    bg:          'bg-orange-50 dark:bg-orange-900/20',
    border:      'border-orange-200 dark:border-orange-800',
    title:       'Additional Information Required',
    description: 'Our team needs more information or documents to proceed with your application.',
    nextStep:    'Please review the request below and update your application.',
  },
  approved: {
    icon:        CheckCircle2,
    color:       'text-green-500',
    bg:          'bg-green-50 dark:bg-green-900/20',
    border:      'border-green-200 dark:border-green-800',
    title:       'Application Approved!',
    description: 'Congratulations! Your vendor application has been approved.',
    nextStep:    'Your store is now active. You can start listing products.',
  },
  rejected: {
    icon:        XCircle,
    color:       'text-red-500',
    bg:          'bg-red-50 dark:bg-red-900/20',
    border:      'border-red-200 dark:border-red-800',
    title:       'Application Rejected',
    description: 'Unfortunately, your vendor application was not approved.',
    nextStep:    'Please review the reason below. You may contact support for further assistance.',
  },
  suspended: {
    icon:        AlertCircle,
    color:       'text-red-500',
    bg:          'bg-red-50 dark:bg-red-900/20',
    border:      'border-red-200 dark:border-red-800',
    title:       'Account Suspended',
    description: 'Your vendor account has been temporarily suspended.',
    nextStep:    'Please contact our support team for more information.',
  },
  closed: {
    icon:        XCircle,
    color:       'text-gray-400',
    bg:          'bg-gray-50 dark:bg-gray-800/50',
    border:      'border-gray-200 dark:border-gray-700',
    title:       'Application Closed',
    description: 'This vendor application has been closed.',
    nextStep:    'Contact support if you believe this is an error.',
  },
};

const STATUS_TIMELINE: ApplicationStatus[] = [
  'submitted',
  'pending_verification',
  'under_review',
  'approved',
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KW', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function VendorStatusPage() {
  const { currentUser, isAuthenticated } = useStore();
  const router = useRouter();

  const [application, setApplication] = useState<ApplicationSummary | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]   = useState(false);

  async function load(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/vendor/application');
      if (!res.ok) throw new Error('Failed to load');
      const { application: raw } = await res.json();

      if (!raw) {
        setApplication(null);
      } else {
        setApplication({
          id:                      raw.id,
          status:                  raw.status,
          storeName:               raw.store_name ?? '',
          storeUsername:           raw.store_username ?? '',
          vendorType:              raw.vendor_type ?? '',
          submittedAt:             raw.submitted_at,
          updatedAt:               raw.updated_at,
          additionalInfoRequested: raw.additional_info_requested,
          rejectionReason:         raw.rejection_reason,
        });
      }
    } catch {
      setError('Failed to load your application status. Please refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login?redirect=/vendor/status');
      return;
    }
    load();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading application status…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={() => load()}
          className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <Store className="w-12 h-12 text-brand-400 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">
          No Application Found
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You haven't started a vendor application yet. Start yours to begin selling on Miova.
        </p>
        <Link
          href="/vendor/register"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
        >
          Start Vendor Application <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const config    = STATUS_CONFIG[application.status] ?? STATUS_CONFIG.submitted;
  const StatusIcon = config.icon;
  const currentTimelineIndex = STATUS_TIMELINE.indexOf(application.status);
  const isDraft   = application.status === 'draft';
  const isApproved = application.status === 'approved';

  const vendorTypeLabels: Record<string, string> = {
    individual: 'Individual Seller', registered_business: 'Registered Business',
    official_brand: 'Official Brand', authorized_distributor: 'Authorized Distributor',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Vendor Application</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">
              Application Status
            </h1>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        {/* Status card */}
        <div className={cn(
          'rounded-2xl border-2 p-6 mb-6',
          config.bg, config.border,
        )}>
          <div className="flex items-start gap-4">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', config.bg)}>
              <StatusIcon className={cn('w-6 h-6', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-lg font-bold font-[family-name:var(--font-heading)]', config.color)}>
                {config.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{config.description}</p>
              {config.nextStep && (
                <div className="flex items-start gap-1.5 mt-2">
                  <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{config.nextStep}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Application info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 mb-6 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Application Details</p>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[
              { label: 'Store Name',    value: application.storeName || '—' },
              { label: 'Store URL',     value: application.storeUsername ? `@${application.storeUsername}` : '—' },
              { label: 'Vendor Type',   value: vendorTypeLabels[application.vendorType] ?? application.vendorType ?? '—' },
              { label: 'Submitted',     value: formatDate(application.submittedAt) },
              { label: 'Last Updated',  value: formatDate(application.updatedAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2.5">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline (non-rejected, non-draft) */}
        {!isDraft && application.status !== 'rejected' && application.status !== 'suspended' && application.status !== 'closed' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Review Progress</p>
            <div className="space-y-1">
              {STATUS_TIMELINE.map((s, idx) => {
                const isPast    = currentTimelineIndex > idx;
                const isCurrent = currentTimelineIndex === idx;
                const sConf     = STATUS_CONFIG[s];
                const Icon      = sConf.icon;
                const isLast    = idx === STATUS_TIMELINE.length - 1;
                return (
                  <div key={s} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                        isPast    ? 'bg-brand-600 border-brand-600' :
                        isCurrent ? 'bg-white dark:bg-gray-800 border-brand-500' :
                        'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
                      )}>
                        {isPast ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <Icon className={cn('w-3.5 h-3.5', isCurrent ? 'text-brand-500' : 'text-gray-300')} />
                        )}
                      </div>
                      {!isLast && (
                        <div className={cn('w-0.5 h-6 mt-1', isPast ? 'bg-brand-300 dark:bg-brand-800' : 'bg-gray-100 dark:bg-gray-800')} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className={cn(
                        'text-sm font-semibold',
                        isPast    ? 'text-gray-900 dark:text-white' :
                        isCurrent ? 'text-brand-600 dark:text-brand-400' :
                        'text-gray-400',
                      )}>
                        {sConf.title}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sConf.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Additional info requested */}
        {application.status === 'additional_info_required' && application.additionalInfoRequested && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-5 mb-6">
            <p className="text-sm font-bold text-orange-800 dark:text-orange-200 mb-2">Information Required</p>
            <p className="text-sm text-orange-700 dark:text-orange-300 whitespace-pre-wrap">
              {application.additionalInfoRequested}
            </p>
            <Link
              href="/vendor/register"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Update Application <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Rejection reason */}
        {application.status === 'rejected' && application.rejectionReason && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 mb-6">
            <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-2">Reason for Rejection</p>
            <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
              {application.rejectionReason}
            </p>
          </div>
        )}

        {/* Approved: go to store */}
        {isApproved && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 mb-6">
            <p className="text-sm font-bold text-green-800 dark:text-green-200 mb-1">Your store is live!</p>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Congratulations, {currentUser?.displayName}! Your Miova vendor store is now active and visible to customers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/store/${application.storeUsername || currentUser?.username}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                <Store className="w-4 h-4" /> View My Store
              </Link>
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-700 dark:text-green-300 font-semibold rounded-xl text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                List First Product <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Draft: go back to wizard */}
        {isDraft && (
          <Link
            href="/vendor/register"
            className="flex items-center justify-center gap-2 w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors mb-6"
          >
            Continue Application <ChevronRight className="w-4 h-4" />
          </Link>
        )}

        {/* Support */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Need Help?</p>
          <div className="space-y-2">
            <a
              href="mailto:vendor@miova.com"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Email Vendor Support</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">vendor@miova.com</p>
              </div>
            </a>
            <a
              href="https://wa.me/965XXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">WhatsApp Support</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sunday–Thursday, 9AM–6PM</p>
              </div>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
