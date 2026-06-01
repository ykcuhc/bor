import { MapPin } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-brand-600">
        <MapPin className="w-8 h-8 animate-bounce" />
        <p className="text-sm font-medium text-gray-500">Loading…</p>
      </div>
    </div>
  );
}
