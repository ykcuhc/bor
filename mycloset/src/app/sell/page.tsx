'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload, X, CheckCircle, ArrowLeft, ArrowRight,
  Camera, Tag, Info, DollarSign, Loader2,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getSupabaseClient } from '@/lib/supabase/client';
import { cn, formatKWD } from '@/lib/utils';
import { calcEarnings, SHIPPING_FEE_KWD } from '@/lib/mockData';
import type { Category, Condition } from '@/types';

// ── Step definitions ───────────────────────────────────────────────────────────

const STEPS = ['Photos', 'Details', 'Pricing', 'Review'];

const CATEGORIES: Category[] = ['Women', 'Men', 'Kids', 'Home', 'Beauty', 'Electronics', 'Pets', 'Garden'];
const CONDITIONS: { value: Condition; label: string; desc: string }[] = [
  { value: 'NWT',       label: 'New With Tags',      desc: 'Brand new, tags attached' },
  { value: 'NWOT',      label: 'New Without Tags',   desc: 'Never worn, tags removed' },
  { value: 'Excellent', label: 'Excellent Condition',desc: 'Worn once or twice, like new' },
  { value: 'Good',      label: 'Good Condition',     desc: 'Gently used, minor signs of wear' },
  { value: 'Fair',      label: 'Fair Condition',     desc: 'Visible wear, priced accordingly' },
];
const SIZES = ['XXS','XS','S','M','L','XL','XXL','XXXL','One Size','0','2','4','6','8','10','12','14','16'];
const BRANDS = [
  'Zara','H&M','Mango','Uniqlo','Nike','Adidas','Chanel','Gucci','Louis Vuitton',
  'Prada','Hermès','Burberry','Ralph Lauren','Tommy Hilfiger','Calvin Klein',
  'Michael Kors','Coach','Versace','Balenciaga','Valentino','Other',
];

// ── Step 1: Photos ─────────────────────────────────────────────────────────────

interface PhotoEntry { preview: string; file: File }

function PhotoStep({
  photos, setPhotos,
}: {
  photos: PhotoEntry[];
  setPhotos: (p: PhotoEntry[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files || []).slice(0, 8 - photos.length);
    const entries: PhotoEntry[] = incoming.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setPhotos([...photos, ...entries]);
    e.target.value = '';
  }

  function removePhoto(idx: number) {
    URL.revokeObjectURL(photos[idx].preview);
    setPhotos(photos.filter((_, i) => i !== idx));
  }

  function setCover(idx: number) {
    const next = [...photos];
    const [cover] = next.splice(idx, 1);
    setPhotos([cover, ...next]);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Add Photos</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add up to 8 photos. The first photo is your cover — click any photo to set it as cover.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {photos.map((entry, i) => (
          <div key={i} className="relative aspect-square group">
            <img
              src={entry.preview}
              alt={`Photo ${i + 1}`}
              className={cn(
                'w-full h-full object-cover rounded-xl cursor-pointer transition-all',
                i === 0 ? 'ring-2 ring-brand-500' : 'hover:opacity-90'
              )}
              onClick={() => setCover(i)}
            />
            {i === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                Cover
              </span>
            )}
            <button
              onClick={() => removePhoto(i)}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {photos.length < 8 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              'aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors',
              photos.length === 0
                ? 'border-brand-400 bg-brand-50 text-brand-600 hover:bg-brand-100 col-span-3 sm:col-span-4 min-h-40'
                : 'border-gray-300 text-gray-400 hover:border-brand-400 hover:text-brand-600'
            )}
          >
            <Upload className="w-6 h-6" />
            <span className="text-xs font-medium">Add Photo</span>
            {photos.length === 0 && (
              <span className="text-xs text-brand-400">Click or drag & drop here</span>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {photos.length === 0 && (
        <p className="text-sm text-red-500">Please add at least one photo to continue.</p>
      )}
    </div>
  );
}

// ── Step 2: Details ────────────────────────────────────────────────────────────

interface DetailsData {
  title: string; description: string; category: Category;
  subCategory: string; brand: string; size: string;
  condition: Condition; color: string; tags: string;
}

function DetailsStep({ data, setData }: { data: DetailsData; setData: (d: DetailsData) => void }) {
  function update(field: keyof DetailsData, value: string) {
    setData({ ...data, [field]: value });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Item Details</h2>
        <p className="text-sm text-gray-500 mt-1">Be descriptive — great listings sell faster.</p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Listing Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={data.title}
          onChange={e => update('title', e.target.value)}
          placeholder="e.g. Zara Floral Midi Dress — Size S — Barely Worn"
          maxLength={80}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
        />
        <p className="text-xs text-gray-400 mt-1">{data.title.length}/80 characters</p>
      </div>

      {/* Category + Brand row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Department <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={data.category}
            onChange={e => update('category', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-400 transition-all"
          >
            <option value="">Select...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand</label>
          <select
            value={data.brand}
            onChange={e => update('brand', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-400 transition-all"
          >
            <option value="">Select brand...</option>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Size + Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Size</label>
          <select
            value={data.size}
            onChange={e => update('size', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-400 transition-all"
          >
            <option value="">Select size...</option>
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Condition <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={data.condition}
            onChange={e => update('condition', e.target.value as Condition)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-brand-400 transition-all"
          >
            <option value="">Select condition...</option>
            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color(s)</label>
        <input
          type="text"
          value={data.color}
          onChange={e => update('color', e.target.value)}
          placeholder="e.g. Black, Gold"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={5}
          value={data.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Describe the item — fabric, fit, measurements, any flaws, what's included (box, dustbag, etc.)..."
          maxLength={1500}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
        />
        <p className="text-xs text-gray-400 mt-1">{data.description.length}/1500 characters</p>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={data.tags}
          onChange={e => update('tags', e.target.value)}
          placeholder="e.g. zara, midi dress, floral, summer"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 transition-all"
        />
      </div>
    </div>
  );
}

// ── Step 3: Pricing ────────────────────────────────────────────────────────────

interface PricingData { originalPrice: string; listingPrice: string; quantity: string }

function PricingStep({ data, setData }: { data: PricingData; setData: (d: PricingData) => void }) {
  function update(field: keyof PricingData, value: string) {
    setData({ ...data, [field]: value });
  }

  const listing  = parseFloat(data.listingPrice) || 0;
  const original = parseFloat(data.originalPrice) || 0;
  const { platformFee, sellerEarnings } = calcEarnings(listing);
  const total    = listing + SHIPPING_FEE_KWD;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Pricing</h2>
        <p className="text-sm text-gray-500 mt-1">Set a competitive price to sell faster.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Original Retail Price (KWD)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">KD</span>
            <input
              type="number"
              step="0.001"
              min="0"
              value={data.originalPrice}
              onChange={e => update('originalPrice', e.target.value)}
              placeholder="0.000"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 transition-all"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">What you originally paid</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Listing Price (KWD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">KD</span>
            <input
              type="number"
              required
              step="0.001"
              min="0.500"
              value={data.listingPrice}
              onChange={e => update('listingPrice', e.target.value)}
              placeholder="0.000"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 transition-all"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Minimum 0.500 KWD</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity</label>
        <input
          type="number"
          min="1"
          max="99"
          value={data.quantity}
          onChange={e => update('quantity', e.target.value)}
          className="w-32 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 transition-all"
        />
      </div>

      {/* Earnings breakdown — only show when a valid listing price is entered */}
      {listing > 0 && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900">Earnings Breakdown</h3>
          {[
            ['Listing Price',        formatKWD(listing)],
            ['Shipping (buyer pays)',`+ ${formatKWD(SHIPPING_FEE_KWD)}`],
            ['Miova Fee (20%)',       `- ${formatKWD(platformFee)}`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-600">{label}</span>
              <span className="font-medium text-gray-800">{value}</span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="text-sm font-bold text-gray-900">You Earn</span>
            <span className="text-lg font-extrabold text-green-600">{formatKWD(sellerEarnings)}</span>
          </div>
        </div>
      )}

      {/* Pricing tips */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-800">
        <p className="font-semibold mb-1">💡 Pricing Tips for Kuwait</p>
        <ul className="space-y-1 text-brand-700 text-xs">
          <li>• Price 20–30% below retail to move items quickly</li>
          <li>• Luxury items hold value — research resale prices first</li>
          <li>• Bundle deals attract more buyers</li>
          <li>• Accept offers to increase chances of selling</li>
        </ul>
      </div>
    </div>
  );
}

// ── Step 4: Review ─────────────────────────────────────────────────────────────

interface ReviewProps {
  photos: PhotoEntry[];
  details: DetailsData;
  pricing: PricingData;
}

function ReviewStep({ photos, details, pricing }: ReviewProps) {
  const listing  = parseFloat(pricing.listingPrice) || 0;
  const { sellerEarnings } = calcEarnings(listing);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review Your Listing</h2>
        <p className="text-sm text-gray-500 mt-1">Everything look good? Submit to publish.</p>
      </div>

      <div className="flex gap-4">
        <img
          src={photos[0]?.preview}
          alt="Cover"
          className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
        />
        <div>
          <h3 className="font-bold text-gray-900">{details.title || '(no title)'}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{details.brand} · {details.size} · {details.condition}</p>
          <p className="text-xl font-extrabold text-gray-900 mt-1">
            {formatKWD(parseFloat(pricing.listingPrice) || 0)}
          </p>
          <p className="text-xs text-green-600 font-medium mt-0.5">
            You earn: {formatKWD(sellerEarnings)}
          </p>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden">
        {[
          ['Photos',      `${photos.length} photo${photos.length !== 1 ? 's' : ''}`],
          ['Category',    details.category || '—'],
          ['Brand',       details.brand    || '—'],
          ['Size',        details.size     || '—'],
          ['Condition',   details.condition || '—'],
          ['Color',       details.color    || '—'],
          ['Tags',        details.tags     || '—'],
        ].map(([k, v], i) => (
          <div key={k} className={cn('flex px-4 py-2.5 text-sm', i % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
            <span className="w-28 text-gray-500 font-medium">{k}</span>
            <span className="text-gray-900">{v}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        <p>
          Your listing will be live immediately after submitting.
          Buyers across Kuwait will be able to find and purchase your item.
        </p>
      </div>
    </div>
  );
}

// ── Main Sell Page ─────────────────────────────────────────────────────────────

export default function SellPage() {
  const router  = useRouter();
  const { isAuthenticated, addListing, currentUser, showToast } = useStore();

  const [step,    setStep]    = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [photos,  setPhotos]  = useState<PhotoEntry[]>([]);
  const [details, setDetails] = useState<DetailsData>({
    title: '', description: '', category: 'Women', subCategory: '',
    brand: '', size: '', condition: 'Good', color: '', tags: '',
  });
  const [pricing, setPricing] = useState<PricingData>({
    originalPrice: '', listingPrice: '', quantity: '1',
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to sell</h2>
        <p className="text-gray-500 mb-6">You need an account to list items on Miova.</p>
        <Link href="/auth/login" className="px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors">
          Sign In
        </Link>
        <p className="mt-4 text-sm text-gray-400">
          No account? <Link href="/auth/register" className="text-brand-600 hover:underline font-medium">Create one free</Link>
        </p>
      </div>
    );
  }

  function canProceed(): boolean {
    if (step === 0) return photos.length > 0;
    if (step === 1) return !!(details.title.trim() && details.category && details.condition && details.description.trim());
    if (step === 2) return parseFloat(pricing.listingPrice) >= 0.5;
    return true;
  }

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }
    // Submit — upload images then create listing
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const imageUrls: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        setUploadProgress(`Uploading photo ${i + 1} of ${photos.length}…`);
        const ext  = photos[i].file.name.split('.').pop() ?? 'jpg';
        const path = `${currentUser!.id}/${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage
          .from('listing-images')
          .upload(path, photos[i].file, { contentType: photos[i].file.type, upsert: false });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(path);
        imageUrls.push(publicUrl);
      }

      setUploadProgress('Publishing listing…');
      const id = await addListing({
        title:         details.title.trim(),
        description:   details.description.trim(),
        images:        imageUrls,
        category:      details.category,
        subCategory:   details.subCategory,
        brand:         details.brand,
        size:          details.size,
        condition:     details.condition,
        color:         details.color.split(',').map(c => c.trim()).filter(Boolean),
        originalPrice: parseFloat(pricing.originalPrice) || 0,
        listingPrice:  parseFloat(pricing.listingPrice),
        quantity:      parseInt(pricing.quantity) || 1,
        tags:          details.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      });

      photos.forEach(p => URL.revokeObjectURL(p.preview));
      showToast('Your listing is live! 🎉', 'success');
      router.push(`/listings/${id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">List an Item</h1>
        <p className="text-gray-500 mt-1">Complete all steps to publish your listing.</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <button
                onClick={() => i < step && setStep(i)}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                  i === step  ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                  i < step    ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600' :
                  'bg-gray-100 text-gray-400'
                )}
              >
                {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
              </button>
              <span className={cn(
                'text-xs mt-1.5 font-medium',
                i === step ? 'text-brand-600' : i < step ? 'text-green-600' : 'text-gray-400'
              )}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 mb-5 transition-colors', i < step ? 'bg-green-400' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-8">
        {step === 0 && <PhotoStep   photos={photos}   setPhotos={setPhotos} />}
        {step === 1 && <DetailsStep data={details}    setData={setDetails} />}
        {step === 2 && <PricingStep data={pricing}    setData={setPricing} />}
        {step === 3 && <ReviewStep  photos={photos}   details={details} pricing={pricing} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : router.back()}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          className={cn(
            'flex items-center gap-2 px-8 py-2.5 text-sm font-bold rounded-full transition-all shadow-sm',
            canProceed() && !loading
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {step === STEPS.length - 1
            ? (loading ? (uploadProgress || 'Publishing…') : 'Publish Listing')
            : 'Continue'
          }
          {!loading && step < STEPS.length - 1 && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
