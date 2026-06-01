import Link from 'next/link';
import { Home, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-10 h-10 text-brand-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">404</h1>
        <p className="font-semibold text-gray-700 text-lg mb-1">Page not found</p>
        <p className="text-gray-500 text-sm mb-8">
          This page doesn&apos;t exist or has been moved to a different neighborhood.
        </p>
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-4 h-4" />
          Go to home feed
        </Link>
      </div>
    </div>
  );
}
