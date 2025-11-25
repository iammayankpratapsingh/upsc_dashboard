import { memo } from 'react';

const formatter = new Intl.NumberFormat('en-IN');

export interface StatCardProps {
  label: string;
  value: number;
  highlight?: string;
  isLoading?: boolean;
  isFetching?: boolean;
}

export const StatCard = memo(
  ({ label, value, highlight, isLoading, isFetching }: StatCardProps) => {
    return (
      <article className="relative rounded-lg border border-neutral bg-surface p-4 shadow-card transition">
        <p className="text-xs font-medium text-muted md:text-sm">{label}</p>
        {isLoading ? (
          <div className="mt-3 h-8 w-28 animate-pulse rounded-full bg-[rgba(148,163,184,0.3)]" />
        ) : (
          <p className="mt-2 text-3xl font-semibold text-primary tracking-tight">
            {formatter.format(value)}
          </p>
        )}
        {highlight && (
          <p className="mt-1 text-xs font-medium text-muted md:text-sm">{highlight}</p>
        )}
        {isFetching && !isLoading && (
          <span className="absolute right-6 top-6 text-xs font-medium text-muted">
            Updating…
          </span>
        )}
      </article>
    );
  },
);

StatCard.displayName = 'StatCard';

