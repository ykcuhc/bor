// Skeleton loading placeholders — prevent layout shift while data loads.

import { clsx } from 'clsx';

interface SkeletonProps { className?: string }

function Bone({ className }: SkeletonProps) {
  return <div className={clsx('animate-pulse bg-gray-200 rounded', className)} />;
}

export function FeedPostSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Bone className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-48" />
        </div>
        <Bone className="h-5 w-20 rounded-full" />
      </div>
      <Bone className="h-4 w-full" />
      <Bone className="h-4 w-5/6" />
      <Bone className="h-4 w-4/6" />
      <div className="flex gap-2 pt-2">
        <Bone className="h-7 w-16 rounded-lg" />
        <Bone className="h-7 w-20 rounded-lg" />
        <Bone className="ml-auto h-7 w-14 rounded-lg" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Bone className="h-32 rounded-none" />
      <div className="p-6 space-y-3">
        <Bone className="w-20 h-20 rounded-full -mt-10" />
        <Bone className="h-6 w-40" />
        <Bone className="h-4 w-24" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function BusinessCardSkeleton() {
  return (
    <div className="card p-4 flex items-start gap-3">
      <Bone className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Bone className="h-4 w-36" />
        <Bone className="h-3 w-24" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-4/5" />
      </div>
    </div>
  );
}
