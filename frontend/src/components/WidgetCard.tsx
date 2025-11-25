import type { PropsWithChildren, ReactNode } from 'react';

interface WidgetCardProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  isFetching?: boolean;
  status?: ReactNode;
}

export const WidgetCard = ({
  title,
  subtitle,
  action,
  children,
  isFetching,
  status,
}: WidgetCardProps) => (
  <section className="relative rounded-lg border border-neutral bg-surface p-4 shadow-card">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-base font-semibold text-primary">{title}</p>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>

    <div
      className={`mt-4 transition-opacity duration-300 ${
        isFetching ? 'opacity-70' : 'opacity-100'
      }`}
    >
      {children}
    </div>

    {status && <div className="mt-3 text-xs text-muted">{status}</div>}

    {isFetching && (
      <span className="absolute right-6 top-6 text-xs font-medium text-muted">
        Updating…
      </span>
    )}
  </section>
);

