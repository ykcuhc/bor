'use client';

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Building2, Star, Award,
  ChevronRight, ChevronLeft, Check, Upload, X,
  AlertCircle, Loader2, Save, Eye, EyeOff,
  Store, Shield, CreditCard, Truck, FileText,
  ClipboardList, Package, Globe,
  Info, ExternalLink, Link2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getSupabaseClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type {
  VendorApplication, VendorType, IdentityDocType,
  ShippingMethod, SocialLinks,
} from '@/types/vendor';
import { defaultApplication } from '@/types/vendor';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'miova_vendor_draft';

const GOVERNORATES = [
  'Al Asimah (Capital)', 'Hawalli', 'Farwaniya', 'Ahmadi',
  'Al Jahra', 'Mubarak Al-Kabeer',
];

const BUSINESS_CATEGORIES = [
  'Fashion & Apparel', 'Accessories & Jewelry', 'Beauty & Skincare',
  'Home & Living', 'Electronics & Gadgets', 'Sports & Fitness',
  'Kids & Baby', 'Art & Crafts', 'Food & Beverages',
  'Health & Wellness', 'Books & Stationery', 'Automotive',
  'Pets & Animals', 'Garden & Outdoor', 'Other',
];

const KUWAIT_REGIONS = [
  'All Kuwait', 'Kuwait City', 'Salmiya', 'Hawalli', 'Rumaithiya',
  'Mishref', 'Jabriya', 'Bayan', 'Shuwaikh', 'Farwaniya',
  'Khaitan', 'Ardiya', 'Fahaheel', 'Mangaf', 'Abu Halifa',
  'Ahmadi', 'Mahboula', 'Fintas', 'Jahra', 'Sulaibikhat',
  'Sabah Al Salem', 'Shuwaikh Industrial', 'Mubarak Al-Kabeer',
];

const KUWAIT_BANKS = [
  'National Bank of Kuwait (NBK)',
  'Kuwait Finance House (KFH)',
  'Gulf Bank',
  'Ahli United Bank (AUB)',
  'Commercial Bank of Kuwait (CBK)',
  'Burgan Bank',
  'Al Ahli Bank of Kuwait (ABK)',
  'Warba Bank',
  'Kuwait International Bank (KIB)',
  'Boubyan Bank',
  'Masraf Al Rayan Kuwait',
  'Other',
];

const STEPS = [
  { id: 1, label: 'Vendor Type',          icon: Award,         desc: 'Choose your seller category' },
  { id: 2, label: 'Business Info',         icon: Building2,     desc: 'Store name and details' },
  { id: 3, label: 'Identity',             icon: Shield,        desc: 'Verify who you are' },
  { id: 4, label: 'Business Docs',        icon: FileText,      desc: 'Registration & licenses' },
  { id: 5, label: 'Store Setup',          icon: Store,         desc: 'Logo, banner & about' },
  { id: 6, label: 'Payout',              icon: CreditCard,    desc: 'Bank & payment details' },
  { id: 7, label: 'Shipping',            icon: Truck,         desc: 'Delivery & fulfillment' },
  { id: 8, label: 'Policies',            icon: ClipboardList, desc: 'Returns & terms' },
  { id: 9, label: 'Review',             icon: Package,       desc: 'Submit your application' },
] as const;

// Step 4 (Business Docs) is only required for non-individual vendors
function requiresBusinessDocs(vendorType: VendorType | null): boolean {
  return vendorType !== null && vendorType !== 'individual';
}

// ─── Validation ───────────────────────────────────────────────────────────────

function ageInYears(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  if (cleaned.length < 15 || cleaned.length > 34) return false;
  // Move first 4 chars to end and convert letters to numbers
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const digits = rearranged.split('').map(c =>
    isNaN(Number(c)) ? (c.charCodeAt(0) - 55).toString() : c
  ).join('');
  // Mod-97 check
  let remainder = 0;
  for (const ch of digits) {
    remainder = (remainder * 10 + Number(ch)) % 97;
  }
  return remainder === 1;
}

function validateStep(step: number, app: VendorApplication): string | null {
  switch (step) {
    case 1:
      if (!app.vendorType) return 'Please select a vendor type to continue.';
      return null;

    case 2:
      if (!app.storeName.trim() || app.storeName.length < 2)
        return 'Store name must be at least 2 characters.';
      if (app.storeName.length > 100)
        return 'Store name must be under 100 characters.';
      if (!app.storeUsername.trim() || app.storeUsername.length < 3)
        return 'Store username must be at least 3 characters.';
      if (app.storeDescription.trim().length < 10)
        return 'Store description must be at least 10 characters.';
      if (!app.businessCategory) return 'Please select a business category.';
      if (!app.governorate)      return 'Please select a governorate.';
      return null;

    case 3:
      if (!app.legalName.trim() || app.legalName.length < 2)
        return 'Full legal name is required.';
      if (!app.dateOfBirth)
        return 'Date of birth is required.';
      if (ageInYears(app.dateOfBirth) < 18)
        return 'You must be at least 18 years old to register as a vendor.';
      if (!app.identityDocType)
        return 'Please select your identity document type.';
      if (!app.identityDocPath)
        return 'Please upload your identity document.';
      return null;

    case 4:
      if (!requiresBusinessDocs(app.vendorType)) return null;
      if (!app.commercialRegPath)
        return 'Commercial registration document is required for your vendor type.';
      return null;

    case 5:
      // Step 5 is optional — logo/banner encouraged but not required
      return null;

    case 6:
      if (!app.payoutHolderName.trim()) return 'Account holder name is required.';
      if (!app.payoutBankName)          return 'Please select your bank.';
      if (!app.payoutIban.trim())       return 'IBAN is required.';
      if (!validateIBAN(app.payoutIban))
        return 'Please enter a valid IBAN (e.g. KW81CBKU0000000000001234560101).';
      return null;

    case 7:
      if (!app.shippingMethods.some(m => m.enabled))
        return 'Please enable at least one shipping method.';
      if (app.deliveryRegions.length === 0)
        return 'Please select at least one delivery region.';
      if (!app.processingTime)
        return 'Please specify your order processing time.';
      return null;

    case 8:
      if (app.returnPolicy.trim().length < 20)
        return 'Return policy must be at least 20 characters.';
      if (app.refundPolicy.trim().length < 20)
        return 'Refund policy must be at least 20 characters.';
      if (app.cancellationPolicy.trim().length < 20)
        return 'Cancellation policy must be at least 20 characters.';
      if (!app.supportContact.trim())
        return 'Customer support contact is required.';
      return null;

    case 9:
      if (!app.termsAccepted)
        return 'You must accept the Vendor Terms & Conditions to submit.';
      return null;

    default:
      return null;
  }
}

// ─── Image compression ────────────────────────────────────────────────────────

async function compressImage(file: File, maxWidth = 1400, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio  = Math.min(maxWidth / img.width, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : resolve(file),
          'image/webp',
          quality,
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

// ─── File upload component ────────────────────────────────────────────────────

interface FileUploadProps {
  label: string;
  hint?: string;
  accept: string;
  maxMB?: number;
  currentPath?: string;
  publicUrl?: string;
  userId: string;
  folder: string;
  bucket: string;
  isImage?: boolean;
  onUploaded: (path: string, publicUrl: string) => void;
  required?: boolean;
}

function FileUpload({
  label, hint, accept, maxMB = 10, currentPath, publicUrl,
  userId, folder, bucket, isImage = false, onUploaded, required = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState<string | null>(null);
  const [preview, setPreview]     = useState<string | null>(publicUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    // Type check
    const allowed = accept.split(',').map(t => t.trim());
    const isAllowed = allowed.some(t => {
      if (t.endsWith('/*')) return file.type.startsWith(t.slice(0, -2));
      return file.type === t;
    });
    if (!isAllowed) {
      setError(`Invalid file type. Accepted: ${accept}`);
      return;
    }

    // Size check
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File must be smaller than ${maxMB} MB.`);
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      let uploadFile: File | Blob = file;

      // Compress images before upload
      if (isImage && file.type.startsWith('image/')) {
        setProgress(30);
        uploadFile = await compressImage(file, isImage ? 1400 : 2400, 0.85);
        setProgress(50);
      }

      const ext       = file.name.split('.').pop() ?? 'bin';
      const filename  = `${Date.now()}_${Math.random().toString(36).slice(2)}.${isImage ? 'webp' : ext}`;
      const storagePath = `${userId}/${folder}/${filename}`;

      const supabase = getSupabaseClient();
      setProgress(70);

      const { data, error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(storagePath, uploadFile, { upsert: true, cacheControl: '31536000' });

      if (uploadErr) throw uploadErr;
      setProgress(90);

      let url = '';
      if (bucket === 'vendor-assets') {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        url = urlData.publicUrl;
      } else {
        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrl(data.path, 86400); // 24h
        url = signed?.signedUrl ?? '';
      }

      if (isImage) setPreview(url);
      setProgress(100);
      onUploaded(data.path, url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  }, [accept, maxMB, isImage, userId, folder, bucket, onUploaded]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}

      {/* Preview */}
      {isImage && preview && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setPreview(null); onUploaded('', ''); }}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Non-image file indicator */}
      {!isImage && currentPath && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-300 truncate flex-1">
            Document uploaded successfully
          </span>
          <button
            type="button"
            onClick={() => onUploaded('', '')}
            className="text-gray-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload button */}
      {(!currentPath && !preview) || uploading ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'w-full flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors',
            uploading
              ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 cursor-not-allowed'
              : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 cursor-pointer'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
              <div className="w-full max-w-[180px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-brand-600">Uploading… {progress}%</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Click to upload {label.toLowerCase()}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Max {maxMB}MB</p>
              </div>
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-brand-600 hover:text-brand-700 underline"
        >
          Replace file
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onChange}
      />

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Step sidebar ─────────────────────────────────────────────────────────────

interface StepSidebarProps {
  currentStep: number;
  completedSteps: number[];
  vendorType: VendorType | null;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onStepClick: (step: number) => void;
}

function StepSidebar({ currentStep, completedSteps, vendorType, saveStatus, onStepClick }: StepSidebarProps) {
  const visibleSteps = STEPS.filter(s =>
    s.id !== 4 || requiresBusinessDocs(vendorType) || completedSteps.includes(4)
  );
  const progress = Math.round((completedSteps.length / STEPS.length) * 100);

  return (
    <aside className="hidden lg:flex flex-col w-72 shrink-0">
      <div className="sticky top-24 space-y-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Vendor Application</p>
              <p className="text-xs text-gray-400">Miova Marketplace</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span className="font-semibold text-brand-600">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Save status */}
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {saveStatus === 'saving' && (
              <><Loader2 className="w-3 h-3 animate-spin text-gray-400" /><span className="text-gray-400">Saving draft…</span></>
            )}
            {saveStatus === 'saved' && (
              <><Check className="w-3 h-3 text-green-500" /><span className="text-green-600 dark:text-green-400">Draft saved</span></>
            )}
            {saveStatus === 'error' && (
              <><AlertCircle className="w-3 h-3 text-red-500" /><span className="text-red-500">Save failed</span></>
            )}
            {saveStatus === 'idle' && (
              <><Save className="w-3 h-3 text-gray-300" /><span className="text-gray-400">Auto-saves as you type</span></>
            )}
          </div>
        </div>

        {/* Steps list */}
        <nav className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {visibleSteps.map((step, idx) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent   = step.id === currentStep;
            const canAccess   = isCompleted || isCurrent || (idx > 0 && completedSteps.includes(visibleSteps[idx - 1]?.id ?? 0));

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => canAccess && onStepClick(step.id)}
                disabled={!canAccess}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 dark:border-gray-800 last:border-0 transition-colors',
                  isCurrent   ? 'bg-brand-50 dark:bg-brand-900/20' : '',
                  canAccess   ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'opacity-50 cursor-not-allowed',
                )}
              >
                {/* Icon / status */}
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors',
                  isCompleted ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                  isCurrent   ? 'bg-brand-600 text-white' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-400',
                )}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <span>{step.id}</span>}
                </div>

                {/* Label */}
                <div className="min-w-0 flex-1">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isCurrent   ? 'text-brand-700 dark:text-brand-300' :
                    isCompleted ? 'text-gray-700 dark:text-gray-300' :
                    'text-gray-400',
                  )}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-brand-500 dark:text-brand-400 truncate">{step.desc}</p>
                  )}
                </div>

                {isCurrent && <ChevronRight className="w-4 h-4 text-brand-400 flex-shrink-0" />}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

// ─── Mobile step indicator ────────────────────────────────────────────────────

function MobileStepBar({ currentStep, totalSteps, stepLabel }: { currentStep: number; totalSteps: number; stepLabel: string }) {
  const progress = Math.round((currentStep / totalSteps) * 100);
  return (
    <div className="lg:hidden mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-bold text-brand-600">{progress}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm font-semibold text-gray-800 dark:text-white">{stepLabel}</p>
    </div>
  );
}

// ─── Field component helpers ──────────────────────────────────────────────────

function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{hint}</p>}
    </div>
  );
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition';
const selectCls = inputCls;
const textareaCls = `${inputCls} resize-none`;

// ─── Step 1 – Vendor Type ─────────────────────────────────────────────────────

const VENDOR_TYPES: {
  type: VendorType;
  icon: React.ElementType;
  label: string;
  desc: string;
  requirements: string[];
}[] = [
  {
    type: 'individual',
    icon: User,
    label: 'Individual Seller',
    desc: 'Selling personal items from your own closet or handmade products.',
    requirements: ['Government-issued ID', 'Bank account for payouts'],
  },
  {
    type: 'registered_business',
    icon: Building2,
    label: 'Registered Business',
    desc: 'A formally registered company, LLC, or enterprise selling products.',
    requirements: ['Commercial registration', 'Business ID', 'Bank account'],
  },
  {
    type: 'official_brand',
    icon: Star,
    label: 'Official Brand',
    desc: 'The official brand owner selling directly to customers on Miova.',
    requirements: ['Brand trademark documents', 'Commercial registration', 'Brand ID'],
  },
  {
    type: 'authorized_distributor',
    icon: Award,
    label: 'Authorized Distributor',
    desc: 'Officially authorized to distribute and sell a brand\'s products.',
    requirements: ['Distributor authorization certificate', 'Commercial registration'],
  },
];

function Step1({ app, onChange }: { app: VendorApplication; onChange: (update: Partial<VendorApplication>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">
          What type of vendor are you?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          This determines your verification requirements. You can't change this after submitting.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {VENDOR_TYPES.map(({ type, icon: Icon, label, desc, requirements }) => {
          const selected = app.vendorType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ vendorType: type })}
              className={cn(
                'relative text-left p-5 rounded-2xl border-2 transition-all duration-200',
                selected
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-md shadow-brand-100 dark:shadow-brand-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm',
              )}
            >
              {selected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                selected ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{desc}</p>
              <ul className="mt-3 space-y-1">
                {requirements.map(r => (
                  <li key={r} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', selected ? 'bg-brand-400' : 'bg-gray-300')} />
                    {r}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2 – Business Info ───────────────────────────────────────────────────

function Step2({
  app, onChange, userId,
}: { app: VendorApplication; onChange: (u: Partial<VendorApplication>) => void; userId: string }) {
  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const debouncedUsername = useDebounce(app.storeUsername, 600);

  useEffect(() => {
    const u = debouncedUsername.trim().toLowerCase();
    if (!u || u.length < 3) { setUsernameState('idle'); return; }
    setUsernameState('checking');
    fetch(`/api/vendor/check-store-username?username=${encodeURIComponent(u)}`)
      .then(r => r.json())
      .then((data: { available?: boolean; error?: string }) => {
        if (data.error) { setUsernameState('error'); setUsernameError(data.error); }
        else { setUsernameState(data.available ? 'available' : 'taken'); setUsernameError(null); }
      })
      .catch(() => setUsernameState('error'));
  }, [debouncedUsername]);

  const socialIcons: Record<string, React.ElementType> = {
    instagram: Link2, twitter: Link2, youtube: Link2,
    facebook: Link2, snapchat: Link2, tiktok: Link2,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">Business Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          This information will appear on your public store page.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Store Name */}
        <div className="sm:col-span-2">
          <FieldLabel label="Store Name" required hint="Your public store name as customers will see it" />
          <input
            type="text"
            className={inputCls}
            value={app.storeName}
            maxLength={100}
            placeholder="My Fashion Store"
            onChange={e => onChange({ storeName: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{app.storeName.length}/100</p>
        </div>

        {/* Store Username */}
        <div className="sm:col-span-2">
          <FieldLabel
            label="Store Username / URL"
            required
            hint="miova.moe/store/your-username — only lowercase letters, numbers, underscores, periods"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none select-none">
              @
            </span>
            <input
              type="text"
              className={cn(inputCls, 'pl-8 pr-24')}
              value={app.storeUsername}
              maxLength={30}
              placeholder="my.store"
              onChange={e => onChange({ storeUsername: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '') })}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameState === 'checking'   && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              {usernameState === 'available'  && <Check className="w-4 h-4 text-green-500" />}
              {usernameState === 'taken'      && <X className="w-4 h-4 text-red-500" />}
            </div>
          </div>
          {usernameState === 'available' && (
            <p className="text-xs text-green-600 mt-1">Username is available</p>
          )}
          {usernameState === 'taken' && (
            <p className="text-xs text-red-500 mt-1">Username is already taken</p>
          )}
          {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
        </div>

        {/* Store Description */}
        <div className="sm:col-span-2">
          <FieldLabel label="Store Description" required hint="Tell customers what you sell (10–1,000 characters)" />
          <textarea
            className={textareaCls}
            rows={4}
            maxLength={1000}
            placeholder="We offer curated fashion from top brands…"
            value={app.storeDescription}
            onChange={e => onChange({ storeDescription: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{app.storeDescription.length}/1,000</p>
        </div>

        {/* Business Category */}
        <div>
          <FieldLabel label="Business Category" required />
          <select
            className={selectCls}
            value={app.businessCategory}
            onChange={e => onChange({ businessCategory: e.target.value })}
          >
            <option value="">Select category…</option>
            {BUSINESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Business Type */}
        <div>
          <FieldLabel label="Business Type" />
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Retailer, Wholesaler, Manufacturer"
            value={app.businessType}
            onChange={e => onChange({ businessType: e.target.value })}
          />
        </div>

        {/* Country */}
        <div>
          <FieldLabel label="Country" required />
          <input
            type="text"
            className={cn(inputCls, 'bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed')}
            value="Kuwait"
            readOnly
          />
        </div>

        {/* Governorate */}
        <div>
          <FieldLabel label="Governorate" required />
          <select
            className={selectCls}
            value={app.governorate}
            onChange={e => onChange({ governorate: e.target.value })}
          >
            <option value="">Select governorate…</option>
            {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Business Address */}
        <div className="sm:col-span-2">
          <FieldLabel label="Business Address" hint="Street, building, area (not shown publicly)" />
          <input
            type="text"
            className={inputCls}
            placeholder="Block 7, Street 12, Building 3, Salmiya"
            value={app.businessAddress}
            onChange={e => onChange({ businessAddress: e.target.value })}
          />
        </div>

        {/* Website */}
        <div>
          <FieldLabel label="Website" hint="Optional" />
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="url"
              className={cn(inputCls, 'pl-9')}
              placeholder="https://yourbrand.com"
              value={app.website}
              onChange={e => onChange({ website: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div>
        <FieldLabel label="Social Media Links" hint="Optional — helps build customer trust" />
        <div className="grid gap-3 sm:grid-cols-2">
          {(['instagram', 'twitter', 'tiktok', 'facebook', 'snapchat', 'youtube'] as const).map(platform => {
            const Icon = socialIcons[platform] ?? ExternalLink;
            return (
              <div key={platform} className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  className={cn(inputCls, 'pl-9')}
                  placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} handle or URL`}
                  value={(app.socialLinks as Record<string, string>)[platform] ?? ''}
                  onChange={e => onChange({
                    socialLinks: { ...app.socialLinks, [platform]: e.target.value } as SocialLinks
                  })}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 – Identity Verification ─────────────────────────────────────────

function Step3({ app, onChange, userId }: { app: VendorApplication; onChange: (u: Partial<VendorApplication>) => void; userId: string }) {
  const ID_TYPES: { type: IdentityDocType; label: string }[] = [
    { type: 'civil_id',        label: 'Civil ID (Kuwait CPR)' },
    { type: 'passport',        label: 'Passport' },
    { type: 'national_id',     label: 'National ID' },
    { type: 'residence_permit',label: 'Residence Permit' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">Identity Verification</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Required to confirm your identity and protect buyers. Documents are stored securely and never shared publicly.
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Your data is secure</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
            Identity documents are encrypted at rest and only reviewed by our verification team. They are never publicly visible.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Full Legal Name */}
        <div className="sm:col-span-2">
          <FieldLabel label="Full Legal Name" required hint="Exactly as it appears on your identity document" />
          <input
            type="text"
            className={inputCls}
            placeholder="Mohammed Al-Abdullah"
            value={app.legalName}
            onChange={e => onChange({ legalName: e.target.value })}
          />
        </div>

        {/* Date of Birth */}
        <div>
          <FieldLabel label="Date of Birth" required hint="You must be 18 or older" />
          <input
            type="date"
            className={inputCls}
            max={new Date(Date.now() - 18 * 365.25 * 86400 * 1000).toISOString().split('T')[0]}
            value={app.dateOfBirth}
            onChange={e => onChange({ dateOfBirth: e.target.value })}
          />
        </div>

        {/* Document Type */}
        <div>
          <FieldLabel label="Identity Document Type" required />
          <select
            className={selectCls}
            value={app.identityDocType ?? ''}
            onChange={e => onChange({ identityDocType: e.target.value as IdentityDocType || null })}
          >
            <option value="">Select document type…</option>
            {ID_TYPES.map(({ type, label }) => (
              <option key={type} value={type}>{label}</option>
            ))}
          </select>
        </div>

        {/* Document Upload */}
        <div className="sm:col-span-2">
          <FileUpload
            label="Identity Document"
            hint="Upload both sides of your ID as a single PDF, or front + back as images. Max 10MB."
            accept="image/jpeg,image/png,image/webp,application/pdf"
            maxMB={10}
            currentPath={app.identityDocPath}
            userId={userId}
            folder="docs/identity"
            bucket="vendor-uploads"
            required
            onUploaded={(path) => onChange({ identityDocPath: path })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 4 – Business Verification ──────────────────────────────────────────

function Step4({ app, onChange, userId }: { app: VendorApplication; onChange: (u: Partial<VendorApplication>) => void; userId: string }) {
  const isDistributor = app.vendorType === 'authorized_distributor';
  const isBrand       = app.vendorType === 'official_brand';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">Business Verification</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload your official business registration documents. All documents are verified by our team.
        </p>
      </div>

      <div className="space-y-6">
        <FileUpload
          label="Commercial Registration / Trade License"
          hint="Your official business registration certificate. Required."
          accept="image/jpeg,image/png,image/webp,application/pdf"
          maxMB={10}
          currentPath={app.commercialRegPath}
          userId={userId}
          folder="docs/business"
          bucket="vendor-uploads"
          required
          onUploaded={(path) => onChange({ commercialRegPath: path })}
        />

        <FileUpload
          label="Business License"
          hint="Municipal or industry-specific license, if applicable. Optional."
          accept="image/jpeg,image/png,image/webp,application/pdf"
          maxMB={10}
          currentPath={app.tradeLicensePath}
          userId={userId}
          folder="docs/business"
          bucket="vendor-uploads"
          onUploaded={(path) => onChange({ tradeLicensePath: path })}
        />

        <FileUpload
          label="Tax Registration Certificate"
          hint="VAT or tax registration, if applicable. Optional."
          accept="image/jpeg,image/png,image/webp,application/pdf"
          maxMB={10}
          currentPath={app.taxRegPath}
          userId={userId}
          folder="docs/business"
          bucket="vendor-uploads"
          onUploaded={(path) => onChange({ taxRegPath: path })}
        />

        {(isDistributor || isBrand) && (
          <FileUpload
            label={isDistributor ? 'Authorized Distributor Certificate' : 'Brand Authorization Document'}
            hint={isDistributor ? 'Official certificate proving you are an authorized distributor for this brand.' : 'Document proving you are the official brand owner or authorized representative.'}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            maxMB={10}
            currentPath={app.distributorCertPath}
            userId={userId}
            folder="docs/business"
            bucket="vendor-uploads"
            onUploaded={(path) => onChange({ distributorCertPath: path })}
          />
        )}
      </div>
    </div>
  );
}

// ─── Step 5 – Store Setup ─────────────────────────────────────────────────────

const ALL_CATEGORIES = ['Women', 'Men', 'Kids', 'Beauty', 'Accessories', 'Home', 'Electronics', 'Pets', 'Garden', 'Sports', 'Books', 'Food', 'Health'];

function Step5({ app, onChange, userId }: { app: VendorApplication; onChange: (u: Partial<VendorApplication>) => void; userId: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">Store Setup</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize your storefront. A great logo and banner help you stand out.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Logo */}
        <FileUpload
          label="Store Logo"
          hint="Square image, minimum 300×300px. Will be displayed on your store page and listings."
          accept="image/jpeg,image/png,image/webp"
          maxMB={5}
          currentPath={app.storeLogoPath}
          publicUrl={app.storeLogoPath ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor-assets/${app.storeLogoPath}` : undefined}
          userId={userId}
          folder="assets"
          bucket="vendor-assets"
          isImage
          onUploaded={(path, url) => onChange({ storeLogoPath: path })}
        />

        {/* Banner */}
        <FileUpload
          label="Store Banner"
          hint="Landscape image, minimum 1200×400px. Displayed at the top of your store page."
          accept="image/jpeg,image/png,image/webp"
          maxMB={5}
          currentPath={app.storeBannerPath}
          publicUrl={app.storeBannerPath ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor-assets/${app.storeBannerPath}` : undefined}
          userId={userId}
          folder="assets"
          bucket="vendor-assets"
          isImage
          onUploaded={(path) => onChange({ storeBannerPath: path })}
        />

        {/* Tagline */}
        <div>
          <FieldLabel label="Store Tagline" hint="A short, catchy slogan — max 150 characters" />
          <input
            type="text"
            className={inputCls}
            maxLength={150}
            placeholder="Your style, curated for you."
            value={app.storeTagline}
            onChange={e => onChange({ storeTagline: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{app.storeTagline.length}/150</p>
        </div>

        {/* About Store */}
        <div>
          <FieldLabel label="About Your Store" hint="Tell the story behind your store — up to 2,000 characters" />
          <textarea
            className={textareaCls}
            rows={5}
            maxLength={2000}
            placeholder="We started in 2020 with a mission to bring…"
            value={app.aboutStore}
            onChange={e => onChange({ aboutStore: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{app.aboutStore.length}/2,000</p>
        </div>

        {/* Categories */}
        <div>
          <FieldLabel label="Store Categories" hint="Select all that apply — helps customers discover your store" />
          <div className="flex flex-wrap gap-2 mt-2">
            {ALL_CATEGORIES.map(cat => {
              const selected = app.storeCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    const next = selected
                      ? app.storeCategories.filter(c => c !== cat)
                      : [...app.storeCategories, cat];
                    onChange({ storeCategories: next });
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                    selected
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-400',
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 6 – Payment & Payout ────────────────────────────────────────────────

function Step6({ app, onChange }: { app: VendorApplication; onChange: (u: Partial<VendorApplication>) => void }) {
  const [showIban, setShowIban] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">Payment & Payout</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your banking details for receiving payments. This information is never publicly visible.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Financial data is encrypted</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
            Your banking information is stored with row-level security. Only authorized Miova staff can access payout details.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Payout Method */}
        <div className="sm:col-span-2">
          <FieldLabel label="Payout Method" required />
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { value: 'bank_transfer', label: 'Bank Transfer', desc: 'IBAN / account transfer' },
              { value: 'knet',          label: 'K-Net',         desc: 'Kuwait payment network' },
              { value: 'future',        label: 'Coming Soon',   desc: 'More options soon', disabled: true },
            ].map(({ value, label, desc, disabled }) => (
              <button
                key={value}
                type="button"
                disabled={!!disabled}
                onClick={() => !disabled && onChange({ payoutMethod: value as VendorApplication['payoutMethod'] })}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-colors',
                  disabled ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700' :
                  app.payoutMethod === value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-800',
                )}
              >
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Account Holder Name */}
        <div className="sm:col-span-2">
          <FieldLabel label="Account Holder Name" required hint="Exactly as registered with your bank" />
          <input
            type="text"
            className={inputCls}
            placeholder="Mohammed Al-Abdullah"
            value={app.payoutHolderName}
            onChange={e => onChange({ payoutHolderName: e.target.value })}
          />
        </div>

        {/* Bank Name */}
        <div>
          <FieldLabel label="Bank Name" required />
          <select
            className={selectCls}
            value={app.payoutBankName}
            onChange={e => onChange({ payoutBankName: e.target.value })}
          >
            <option value="">Select bank…</option>
            {KUWAIT_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Bank Account Number */}
        <div>
          <FieldLabel label="Account Number" hint="Optional if IBAN is provided" />
          <input
            type="text"
            className={inputCls}
            placeholder="123456789"
            value={app.payoutAccountNumber}
            onChange={e => onChange({ payoutAccountNumber: e.target.value.replace(/\D/g, '') })}
          />
        </div>

        {/* IBAN */}
        <div className="sm:col-span-2">
          <FieldLabel label="IBAN" required hint="Kuwait IBAN format: KW + 2 digits + 4 letters + 22 characters = 30 total" />
          <div className="relative">
            <input
              type={showIban ? 'text' : 'password'}
              className={cn(inputCls, 'pr-10 font-mono tracking-wider')}
              placeholder="KW81CBKU0000000000001234560101"
              maxLength={34}
              value={app.payoutIban}
              onChange={e => onChange({ payoutIban: e.target.value.replace(/\s/g, '').toUpperCase() })}
            />
            <button
              type="button"
              onClick={() => setShowIban(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showIban ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {app.payoutIban && app.payoutIban.length >= 15 && (
            <p className={cn('text-xs mt-1', validateIBAN(app.payoutIban) ? 'text-green-600' : 'text-red-500')}>
              {validateIBAN(app.payoutIban) ? '✓ Valid IBAN format' : '✗ Invalid IBAN — please check and re-enter'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 7 – Shipping ────────────────────────────────────────────────────────

function Step7({ app, onChange }: { app: VendorApplication; onChange: (u: Partial<VendorApplication>) => void }) {
  const toggleMethod = (id: string) => {
    onChange({
      shippingMethods: app.shippingMethods.map(m =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      ),
    });
  };

  const toggleRegion = (region: string) => {
    const isAll = region === 'All Kuwait';
    if (isAll) {
      onChange({ deliveryRegions: app.deliveryRegions.includes('All Kuwait') ? [] : ['All Kuwait'] });
    } else {
      const next = app.deliveryRegions.includes(region)
        ? app.deliveryRegions.filter(r => r !== region && r !== 'All Kuwait')
        : [...app.deliveryRegions.filter(r => r !== 'All Kuwait'), region];
      onChange({ deliveryRegions: next });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">Shipping & Fulfillment</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure how you'll deliver orders to customers.
        </p>
      </div>

      {/* Shipping Methods */}
      <div>
        <FieldLabel label="Shipping Methods" required hint="Enable at least one method" />
        <div className="space-y-3">
          {app.shippingMethods.map((method: ShippingMethod) => (
            <div
              key={method.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 transition-colors',
                method.enabled
                  ? 'border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
              )}
            >
              <button
                type="button"
                onClick={() => toggleMethod(method.id)}
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                  method.enabled
                    ? 'bg-brand-600 border-brand-600'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
                )}
              >
                {method.enabled && <Check className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{method.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{method.estimatedDays}</p>
              </div>
              {method.enabled && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fee (KWD)</p>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-24 px-2 py-1 text-sm text-right rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-400"
                    value={
                      method.id === 'standard' ? app.shippingFees.standard :
                      method.id === 'express'  ? app.shippingFees.express  :
                      method.id === 'same_day' ? app.shippingFees.sameDay  :
                      0
                    }
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 0;
                      const key = method.id === 'standard' ? 'standard' : method.id === 'express' ? 'express' : 'sameDay';
                      onChange({ shippingFees: { ...app.shippingFees, [key]: v } });
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Processing Time */}
      <div>
        <FieldLabel label="Order Processing Time" required hint="How long before you ship after an order is placed" />
        <select
          className={selectCls}
          value={app.processingTime}
          onChange={e => onChange({ processingTime: e.target.value })}
        >
          <option value="">Select…</option>
          <option value="same_day">Same day</option>
          <option value="1">1 business day</option>
          <option value="1-2">1–2 business days</option>
          <option value="2-3">2–3 business days</option>
          <option value="3-5">3–5 business days</option>
          <option value="1-2_weeks">1–2 weeks</option>
        </select>
      </div>

      {/* Delivery Regions */}
      <div>
        <FieldLabel label="Delivery Regions" required hint="Select the areas you deliver to in Kuwait" />
        <div className="flex flex-wrap gap-2 mt-2">
          {KUWAIT_REGIONS.map(region => {
            const selected = app.deliveryRegions.includes(region);
            return (
              <button
                key={region}
                type="button"
                onClick={() => toggleRegion(region)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  selected
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-400',
                )}
              >
                {region}
              </button>
            );
          })}
        </div>
      </div>

      {/* Free Shipping Threshold */}
      <div>
        <FieldLabel label="Free Shipping Threshold (KWD)" hint="Orders above this amount get free shipping. Leave blank to disable." />
        <input
          type="number"
          step="0.5"
          min="0"
          className={inputCls}
          placeholder="e.g. 10 (free shipping on orders above KD 10)"
          value={app.freeShippingThreshold ?? ''}
          onChange={e => onChange({ freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : null })}
        />
      </div>

      {/* Pickup */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => onChange({ pickupAvailable: !app.pickupAvailable })}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
            app.pickupAvailable
              ? 'bg-brand-600 border-brand-600'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
          )}
        >
          {app.pickupAvailable && <Check className="w-3 h-3 text-white" />}
        </button>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">In-store / pickup available</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Customers can pick up orders from your location</p>
        </div>
      </div>
    </div>
  );
}

// ─── Step 8 – Store Policies ──────────────────────────────────────────────────

const POLICY_TEMPLATES = {
  return:       'Customers may return items within 7 days of delivery. Items must be in original condition, unworn, and with all tags attached. Return shipping costs are the responsibility of the buyer unless the item is defective or incorrectly described.',
  refund:       'Refunds will be processed within 5–7 business days after we receive and inspect the returned item. Refunds are issued to the original payment method. We do not refund original shipping fees unless the return is due to our error.',
  warranty:     '',
  cancellation: 'Orders may be cancelled within 12 hours of placement before they are shipped. Once an order has been shipped, cancellations are no longer possible. To cancel, please contact us through the Miova messaging system.',
};

function PolicyTextarea({ label, required, hint, value, placeholder, onChange }: {
  label: string; required?: boolean; hint?: string; value: string;
  placeholder: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} hint={hint} />
      <textarea
        className={textareaCls}
        rows={5}
        minLength={required ? 20 : 0}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <p className="text-xs text-gray-400 mt-1 text-right">{value.length} characters</p>
    </div>
  );
}

function Step8({ app, onChange }: { app: VendorApplication; onChange: (u: Partial<VendorApplication>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">Store Policies</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your policies will be displayed publicly on your store page. Be clear and transparent.
        </p>
      </div>

      <PolicyTextarea
        label="Return Policy" required
        hint="How long customers have to return items and under what conditions"
        value={app.returnPolicy}
        placeholder={POLICY_TEMPLATES.return}
        onChange={v => onChange({ returnPolicy: v })}
      />

      <PolicyTextarea
        label="Refund Policy" required
        hint="How and when refunds are processed"
        value={app.refundPolicy}
        placeholder={POLICY_TEMPLATES.refund}
        onChange={v => onChange({ refundPolicy: v })}
      />

      <PolicyTextarea
        label="Cancellation Policy" required
        hint="When and how orders can be cancelled"
        value={app.cancellationPolicy}
        placeholder={POLICY_TEMPLATES.cancellation}
        onChange={v => onChange({ cancellationPolicy: v })}
      />

      <PolicyTextarea
        label="Warranty Policy"
        hint="Optional — applicable for electronics, appliances, etc."
        value={app.warrantyPolicy}
        placeholder="This product comes with a 12-month manufacturer warranty…"
        onChange={v => onChange({ warrantyPolicy: v })}
      />

      <div>
        <FieldLabel label="Customer Support Contact" required hint="Email address, WhatsApp number, or both" />
        <input
          type="text"
          className={inputCls}
          placeholder="support@mystore.com  or  +965 XXXX XXXX"
          value={app.supportContact}
          onChange={e => onChange({ supportContact: e.target.value })}
        />
      </div>
    </div>
  );
}

// ─── Step 9 – Review & Submit ─────────────────────────────────────────────────

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | boolean | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-36 flex-shrink-0">{label}:</span>
      <span className="text-xs text-gray-800 dark:text-gray-200 flex-1 break-words">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
      </span>
    </div>
  );
}

function Step9({ app, onChange, onEditStep }: {
  app: VendorApplication;
  onChange: (u: Partial<VendorApplication>) => void;
  onEditStep: (s: number) => void;
}) {
  const vendorTypeLabels: Record<string, string> = {
    individual: 'Individual Seller', registered_business: 'Registered Business',
    official_brand: 'Official Brand', authorized_distributor: 'Authorized Distributor',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">Review & Submit</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review your application before submitting. You can edit any section below.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vendor Type</h3>
          <button type="button" onClick={() => onEditStep(1)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Edit</button>
        </div>
        <ReviewSection title="Vendor Type">
          <ReviewRow label="Type" value={app.vendorType ? vendorTypeLabels[app.vendorType] : undefined} />
        </ReviewSection>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Business Information</h3>
          <button type="button" onClick={() => onEditStep(2)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Edit</button>
        </div>
        <ReviewSection title="Store Details">
          <ReviewRow label="Store Name" value={app.storeName} />
          <ReviewRow label="Username" value={`@${app.storeUsername}`} />
          <ReviewRow label="Category" value={app.businessCategory} />
          <ReviewRow label="Governorate" value={app.governorate} />
          <ReviewRow label="Website" value={app.website} />
        </ReviewSection>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Identity</h3>
          <button type="button" onClick={() => onEditStep(3)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Edit</button>
        </div>
        <ReviewSection title="Identity Verification">
          <ReviewRow label="Legal Name" value={app.legalName} />
          <ReviewRow label="Date of Birth" value={app.dateOfBirth} />
          <ReviewRow label="Document Type" value={app.identityDocType?.replace(/_/g, ' ') ?? undefined} />
          <ReviewRow label="Document" value={app.identityDocPath ? 'Uploaded ✓' : 'Not uploaded'} />
        </ReviewSection>

        {requiresBusinessDocs(app.vendorType) && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Business Documents</h3>
              <button type="button" onClick={() => onEditStep(4)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Edit</button>
            </div>
            <ReviewSection title="Business Verification">
              <ReviewRow label="Commercial Reg." value={app.commercialRegPath ? 'Uploaded ✓' : 'Not uploaded'} />
              <ReviewRow label="Trade License" value={app.tradeLicensePath ? 'Uploaded ✓' : 'Not uploaded'} />
            </ReviewSection>
          </>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Payout</h3>
          <button type="button" onClick={() => onEditStep(6)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Edit</button>
        </div>
        <ReviewSection title="Payment Information">
          <ReviewRow label="Account Holder" value={app.payoutHolderName} />
          <ReviewRow label="Bank" value={app.payoutBankName} />
          <ReviewRow label="IBAN" value={app.payoutIban ? `${app.payoutIban.slice(0, 6)}••••••••${app.payoutIban.slice(-4)}` : undefined} />
        </ReviewSection>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Shipping</h3>
          <button type="button" onClick={() => onEditStep(7)} className="text-xs text-brand-600 hover:text-brand-700 font-medium">Edit</button>
        </div>
        <ReviewSection title="Shipping Configuration">
          <ReviewRow label="Methods" value={app.shippingMethods.filter(m => m.enabled).map(m => m.name).join(', ')} />
          <ReviewRow label="Processing" value={app.processingTime} />
          <ReviewRow label="Regions" value={app.deliveryRegions.join(', ')} />
          <ReviewRow label="Free shipping" value={app.freeShippingThreshold ? `Over KD ${app.freeShippingThreshold.toFixed(3)}` : 'Not enabled'} />
        </ReviewSection>
      </div>

      {/* Terms */}
      <div className={cn(
        'p-5 rounded-xl border-2 transition-colors',
        app.termsAccepted ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
      )}>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onChange({ termsAccepted: !app.termsAccepted })}
            className={cn(
              'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
              app.termsAccepted ? 'bg-brand-600 border-brand-600' : 'border-gray-300 dark:border-gray-600',
            )}
          >
            {app.termsAccepted && <Check className="w-3 h-3 text-white" />}
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">I accept the Vendor Terms & Conditions</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              By submitting this application, I confirm that all information provided is accurate and truthful.
              I agree to Miova's{' '}
              <Link href="/terms" className="text-brand-600 underline hover:text-brand-700">Vendor Terms</Link>,{' '}
              <Link href="/privacy" className="text-brand-600 underline hover:text-brand-700">Privacy Policy</Link>,
              and marketplace rules.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">What happens after submission?</p>
          <ol className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-0.5 list-decimal list-inside">
            <li>Our team will review your application within 2–5 business days.</li>
            <li>You'll receive an email notification for any additional information needed.</li>
            <li>Once approved, your store will go live and you can start listing products.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VendorRegisterPage() {
  const { currentUser, isAuthenticated, showToast } = useStore();
  const router = useRouter();

  const [app, setApp]               = useState<VendorApplication | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompleted] = useState<number[]>([]);
  const [stepError, setStepError]    = useState<string | null>(null);
  const [saveStatus, setSaveStatus]  = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [submitting, setSubmitting]  = useState(false);
  const [loading, setLoading]        = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appRef       = useRef<VendorApplication | null>(null);

  // ── Init: load draft ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      if (!isAuthenticated) router.replace('/auth/login?redirect=/vendor/register');
      return;
    }

    async function initDraft() {
      setLoading(true);

      // 1. Try localStorage first (instant)
      let draft: VendorApplication | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.userId === currentUser!.id) draft = parsed;
        }
      } catch { /* ignore */ }

      // 2. Load from API (may override localStorage if newer)
      try {
        const res = await fetch('/api/vendor/application');
        if (res.ok) {
          const { application } = await res.json();
          if (application) {
            if (application.status !== 'draft' && application.status !== 'additional_info_required') {
              setAlreadySubmitted(true);
              setLoading(false);
              return;
            }
            // Merge API data into a VendorApplication shape
            draft = mergeApiApplication(application, currentUser!.id);
          }
        }
      } catch { /* use localStorage version if API fails */ }

      // 3. If still no draft, create one
      if (!draft) {
        draft = defaultApplication(currentUser!.id);
        try {
          const res = await fetch('/api/vendor/application', { method: 'POST' });
          if (res.ok) {
            const { applicationId } = await res.json();
            draft.id = applicationId;
          }
        } catch { /* proceed without server ID */ }
      }

      setApp(draft);
      appRef.current = draft;
      setCurrentStep(draft.currentStep);
      setCompleted(draft.completedSteps);
      setLoading(false);
    }

    initDraft();
  }, [isAuthenticated, currentUser]);

  // ── Persist to localStorage on every change ───────────────────────────────

  useEffect(() => {
    if (!app) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(app)); } catch { /* quota */ }
  }, [app]);

  // ── Debounced API autosave ────────────────────────────────────────────────

  const scheduleSave = useCallback((updatedApp: VendorApplication) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(async () => {
      try {
        const payload = appToApiPayload(updatedApp);
        const res = await fetch('/api/vendor/application', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        setSaveStatus(res.ok ? 'saved' : 'error');
        if (res.ok) setTimeout(() => setSaveStatus('idle'), 3000);
      } catch {
        setSaveStatus('error');
      }
    }, 2000);
  }, []);

  // ── Update application state ──────────────────────────────────────────────

  const updateApp = useCallback((update: Partial<VendorApplication>) => {
    setApp(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...update };
      appRef.current = next;
      scheduleSave(next);
      return next;
    });
    setStepError(null);
  }, [scheduleSave]);

  // ── Step navigation ───────────────────────────────────────────────────────

  const totalSteps = app && requiresBusinessDocs(app.vendorType) ? 9 : 8;

  function effectiveStep(uiStep: number): number {
    if (!app || requiresBusinessDocs(app.vendorType)) return uiStep;
    // Skip step 4 for individual vendors
    return uiStep >= 4 ? uiStep + 1 : uiStep;
  }

  function goToStep(targetStep: number) {
    setCurrentStep(targetStep);
    setStepError(null);
    if (app) {
      const updated = { ...app, currentStep: targetStep };
      setApp(updated);
      scheduleSave(updated);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleNext() {
    if (!app) return;
    const error = validateStep(currentStep, app);
    if (error) { setStepError(error); return; }

    const newCompleted = completedSteps.includes(currentStep)
      ? completedSteps
      : [...completedSteps, currentStep];
    setCompleted(newCompleted);

    // Determine next step (skip step 4 for individuals)
    let next = currentStep + 1;
    if (next === 4 && !requiresBusinessDocs(app.vendorType)) next = 5;
    if (next > 9) next = 9;

    const updated = { ...app, completedSteps: newCompleted, currentStep: next };
    setApp(updated);
    appRef.current = updated;
    scheduleSave(updated);
    setCurrentStep(next);
    setStepError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    let prev = currentStep - 1;
    if (prev === 4 && app && !requiresBusinessDocs(app.vendorType)) prev = 3;
    if (prev < 1) prev = 1;
    goToStep(prev);
  }

  async function handleSubmit() {
    if (!app) return;
    const error = validateStep(9, app);
    if (error) { setStepError(error); return; }

    setSubmitting(true);
    try {
      // Final save before submit
      await fetch('/api/vendor/application', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...appToApiPayload(app), terms_accepted: true }),
      });

      const res = await fetch('/api/vendor/application', { method: 'PUT' });
      const data = await res.json();

      if (!res.ok) {
        setStepError(data.error ?? 'Submission failed. Please try again.');
        return;
      }

      // Clear local draft
      localStorage.removeItem(STORAGE_KEY);
      showToast('Application submitted successfully!', 'success');
      router.push('/vendor/status');
    } catch {
      setStepError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function saveDraft() {
    if (!app) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/vendor/application', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(appToApiPayload(app)),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
      if (res.ok) {
        showToast('Draft saved successfully', 'success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch {
      setSaveStatus('error');
    }
  }

  // ── Render guards ─────────────────────────────────────────────────────────

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading your application…</p>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto">
          <ClipboardList className="w-8 h-8 text-brand-600 dark:text-brand-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-[family-name:var(--font-heading)]">
          Application Already Submitted
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your vendor application has been submitted and is under review. Check your application status below.
        </p>
        <Link
          href="/vendor/status"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
        >
          View Application Status <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (!app) return null;

  const currentStepMeta = STEPS.find(s => s.id === currentStep);
  const isLastStep      = currentStep === 9;
  const showBizDocs     = requiresBusinessDocs(app.vendorType);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <StepSidebar
            currentStep={currentStep}
            completedSteps={completedSteps}
            vendorType={app.vendorType}
            saveStatus={saveStatus}
            onStepClick={goToStep}
          />

          {/* Main */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Mobile step bar */}
            <MobileStepBar
              currentStep={currentStep}
              totalSteps={showBizDocs ? 9 : 8}
              stepLabel={currentStepMeta?.label ?? ''}
            />

            {/* Step content */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 lg:p-8">
              {currentStep === 1 && <Step1 app={app} onChange={updateApp} />}
              {currentStep === 2 && <Step2 app={app} onChange={updateApp} userId={currentUser!.id} />}
              {currentStep === 3 && <Step3 app={app} onChange={updateApp} userId={currentUser!.id} />}
              {currentStep === 4 && <Step4 app={app} onChange={updateApp} userId={currentUser!.id} />}
              {currentStep === 5 && <Step5 app={app} onChange={updateApp} userId={currentUser!.id} />}
              {currentStep === 6 && <Step6 app={app} onChange={updateApp} />}
              {currentStep === 7 && <Step7 app={app} onChange={updateApp} />}
              {currentStep === 8 && <Step8 app={app} onChange={updateApp} />}
              {currentStep === 9 && <Step9 app={app} onChange={updateApp} onEditStep={goToStep} />}
            </div>

            {/* Step error */}
            {stepError && (
              <div className="flex items-center gap-2.5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-slide-up">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{stepError}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
              <div className="flex items-center justify-between gap-3">
                {/* Back */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-colors',
                    currentStep === 1
                      ? 'opacity-40 cursor-not-allowed border-gray-200 text-gray-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="flex items-center gap-2">
                  {/* Save Draft */}
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className="hidden sm:inline">Save Draft</span>
                  </button>

                  {/* Next / Submit */}
                  {isLastStep ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || !app.termsAccepted}
                      className={cn(
                        'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors',
                        'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-200 dark:shadow-brand-900/20',
                        (submitting || !app.termsAccepted) && 'opacity-60 cursor-not-allowed',
                      )}
                    >
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                      ) : (
                        <><Check className="w-4 h-4" /> Submit Application</>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-200 dark:shadow-brand-900/20 transition-colors"
                    >
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Data mapping helpers ──────────────────────────────────────────────────────

function mergeApiApplication(row: Record<string, unknown>, userId: string): VendorApplication {
  const base = defaultApplication(userId);
  return {
    ...base,
    id:                         (row.id as string) ?? null,
    userId,
    status:                     (row.status as VendorApplication['status']) ?? 'draft',
    currentStep:                (row.current_step as number) ?? 1,
    completedSteps:             (row.completed_steps as number[]) ?? [],
    vendorType:                 (row.vendor_type as VendorType) ?? null,
    storeName:                  (row.store_name as string) ?? '',
    storeUsername:              (row.store_username as string) ?? '',
    storeDescription:           (row.store_description as string) ?? '',
    businessCategory:           (row.business_category as string) ?? '',
    businessType:               (row.business_type as string) ?? '',
    country:                    (row.country as string) ?? 'Kuwait',
    governorate:                (row.governorate as string) ?? '',
    businessAddress:            (row.business_address as string) ?? '',
    website:                    (row.website as string) ?? '',
    socialLinks:                (row.social_links as SocialLinks) ?? {},
    legalName:                  (row.legal_name as string) ?? '',
    dateOfBirth:                (row.date_of_birth as string) ?? '',
    identityDocType:            (row.identity_doc_type as IdentityDocType) ?? null,
    identityDocPath:            (row.identity_doc_path as string) ?? '',
    identityVerificationStatus: (row.identity_verification_status as VendorApplication['identityVerificationStatus']) ?? 'pending',
    commercialRegPath:          (row.commercial_reg_path as string) ?? '',
    tradeLicensePath:           (row.trade_license_path as string) ?? '',
    taxRegPath:                 (row.tax_reg_path as string) ?? '',
    distributorCertPath:        (row.distributor_cert_path as string) ?? '',
    businessVerificationStatus: (row.business_verification_status as VendorApplication['businessVerificationStatus']) ?? 'pending',
    storeLogoPath:              (row.store_logo as string) ?? '',
    storeBannerPath:            (row.store_banner as string) ?? '',
    storeTagline:               (row.store_tagline as string) ?? '',
    aboutStore:                 (row.about_store as string) ?? '',
    storeCategories:            (row.store_categories as string[]) ?? [],
    payoutHolderName:           (row.payout_holder_name as string) ?? '',
    payoutBankName:             (row.payout_bank_name as string) ?? '',
    payoutIban:                 (row.payout_iban as string) ?? '',
    payoutAccountNumber:        (row.payout_account_number as string) ?? '',
    payoutMethod:               (row.payout_method as VendorApplication['payoutMethod']) ?? 'bank_transfer',
    shippingMethods:            (row.shipping_methods as VendorApplication['shippingMethods']) ?? base.shippingMethods,
    processingTime:             (row.processing_time as string) ?? '',
    deliveryRegions:            (row.delivery_regions as string[]) ?? [],
    pickupAvailable:            (row.pickup_available as boolean) ?? false,
    shippingFees:               (row.shipping_fees as VendorApplication['shippingFees']) ?? base.shippingFees,
    freeShippingThreshold:      row.free_shipping_threshold != null ? Number(row.free_shipping_threshold) : null,
    returnPolicy:               (row.return_policy as string) ?? '',
    refundPolicy:               (row.refund_policy as string) ?? '',
    warrantyPolicy:             (row.warranty_policy as string) ?? '',
    cancellationPolicy:         (row.cancellation_policy as string) ?? '',
    supportContact:             (row.support_contact as string) ?? '',
    termsAccepted:              (row.terms_accepted as boolean) ?? false,
    submittedAt:                (row.submitted_at as string) ?? null,
    additionalInfoRequested:    (row.additional_info_requested as string) ?? null,
    rejectionReason:            (row.rejection_reason as string) ?? null,
    createdAt:                  (row.created_at as string) ?? null,
    updatedAt:                  (row.updated_at as string) ?? null,
  };
}

function appToApiPayload(app: VendorApplication): Record<string, unknown> {
  return {
    vendor_type:             app.vendorType,
    store_name:              app.storeName,
    store_username:          app.storeUsername,
    store_description:       app.storeDescription,
    business_category:       app.businessCategory,
    business_type:           app.businessType,
    country:                 app.country,
    governorate:             app.governorate,
    business_address:        app.businessAddress,
    website:                 app.website,
    social_links:            app.socialLinks,
    legal_name:              app.legalName,
    date_of_birth:           app.dateOfBirth || null,
    identity_doc_type:       app.identityDocType,
    identity_doc_path:       app.identityDocPath,
    commercial_reg_path:     app.commercialRegPath,
    trade_license_path:      app.tradeLicensePath,
    tax_reg_path:            app.taxRegPath,
    distributor_cert_path:   app.distributorCertPath,
    store_logo:              app.storeLogoPath,
    store_banner:            app.storeBannerPath,
    store_tagline:           app.storeTagline,
    about_store:             app.aboutStore,
    store_categories:        app.storeCategories,
    payout_holder_name:      app.payoutHolderName,
    payout_bank_name:        app.payoutBankName,
    payout_iban:             app.payoutIban,
    payout_account_number:   app.payoutAccountNumber,
    payout_method:           app.payoutMethod,
    shipping_methods:        app.shippingMethods,
    processing_time:         app.processingTime,
    delivery_regions:        app.deliveryRegions,
    pickup_available:        app.pickupAvailable,
    shipping_fees:           app.shippingFees,
    free_shipping_threshold: app.freeShippingThreshold,
    return_policy:           app.returnPolicy,
    refund_policy:           app.refundPolicy,
    warranty_policy:         app.warrantyPolicy,
    cancellation_policy:     app.cancellationPolicy,
    support_contact:         app.supportContact,
    terms_accepted:          app.termsAccepted,
    current_step:            app.currentStep,
    completed_steps:         app.completedSteps,
  };
}
