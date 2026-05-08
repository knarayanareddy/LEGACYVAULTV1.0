import { FC } from 'react';
import { clsx } from 'clsx';

interface ShimmerProps {
  className?: string;
}

export const Shimmer: FC<ShimmerProps> = ({ className }) => (
  <div
    className={clsx(
      'animate-pulse rounded-md bg-white/5',
      className,
    )}
  />
);

export const DashboardSkeleton: FC = () => (
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-5 flex flex-col gap-3">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-8 w-32" />
          <Shimmer className="h-3 w-16" />
        </div>
      ))}
    </div>
    <div className="glass-card p-6">
      <Shimmer className="h-4 w-36 mb-6" />
      <Shimmer className="h-48 w-full" />
    </div>
    <div className="glass-card p-5 flex flex-col gap-3">
      <Shimmer className="h-4 w-28 mb-2" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Shimmer className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Shimmer className="h-3 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface ListSkeletonProps { rows?: number }

export const ListSkeleton: FC<ListSkeletonProps> = ({ rows = 4 }) => (
  <div className="glass-card p-5 flex flex-col gap-4">
    <div className="flex items-center justify-between mb-2">
      <Shimmer className="h-4 w-32" />
      <Shimmer className="h-8 w-24 rounded-lg" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5"
      >
        <Shimmer className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <Shimmer className="h-3 w-40" />
          <Shimmer className="h-3 w-24" />
        </div>
        <Shimmer className="h-6 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

export const SettingsSkeleton: FC = () => (
  <div className="flex flex-col gap-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="glass-card p-6 flex flex-col gap-4">
        <Shimmer className="h-4 w-36 mb-1" />
        {Array.from({ length: 3 }).map((_, j) => (
          <div key={j} className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Shimmer className="h-3 w-28" />
              <Shimmer className="h-3 w-44" />
            </div>
            <Shimmer className="h-8 w-32 rounded-lg" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const LivenessSkeleton: FC = () => (
  <div className="flex flex-col gap-6">
    <div className="glass-card p-6 flex flex-col gap-4">
      <Shimmer className="h-4 w-36" />
      <div className="flex items-center gap-6">
        <Shimmer className="h-24 w-24 rounded-full shrink-0" />
        <div className="flex flex-col gap-3 flex-1">
          <Shimmer className="h-6 w-32" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-3/4" />
        </div>
      </div>
    </div>
    <ListSkeleton rows={3} />
  </div>
);

export const DistributionSkeleton: FC = () => (
  <div className="flex flex-col gap-6">
    <div className="glass-card p-5 flex items-center justify-between">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Shimmer className="h-10 w-10 rounded-full" />
          <Shimmer className="h-3 w-16" />
        </div>
      ))}
    </div>
    <div className="glass-card p-5 flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Shimmer className="h-6 w-6 rounded-full shrink-0" />
          <Shimmer className="h-3 flex-1" />
          <Shimmer className="h-6 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  </div>
);

export const VaultSkeleton: FC = () => (
  <div className="flex flex-col gap-6">
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Shimmer className="h-5 w-40" />
        <Shimmer className="h-6 w-20 rounded-full" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
          <Shimmer className="h-3 w-28" />
          <Shimmer className="h-3 w-36" />
        </div>
      ))}
    </div>
    <ListSkeleton rows={3} />
  </div>
);
