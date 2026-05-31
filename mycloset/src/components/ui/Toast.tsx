'use client';

import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export default function Toast() {
  const { toast, clearToast } = useStore();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />,
    error:   <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
    info:    <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-l-4 border-l-green-500',
    error:   'border-l-4 border-l-red-500',
    info:    'border-l-4 border-l-blue-500',
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up">
      <div className={cn(
        'flex items-center gap-3 bg-white shadow-xl rounded-xl px-5 py-3.5 min-w-[280px] max-w-sm',
        borders[toast.type]
      )}>
        {icons[toast.type]}
        <p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
        <button onClick={clearToast} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
