import type { DashboardFilters, FilterOptions } from '../types';

interface FilterBarProps {
  filters: DashboardFilters;
  options?: FilterOptions;
  onChange: (next: DashboardFilters) => void;
  onApply: () => void;
  onReset?: () => void;
  isFetching?: boolean;
  isDisabled?: boolean;
  showReset?: boolean;
}

const baseControlClasses =
  'w-full appearance-none rounded-xl border border-neutral bg-surface px-3 py-2 text-xs font-medium text-primary shadow-sm outline-none transition hover:border-accent/40 focus:border-accent focus:bg-surface-muted md:text-sm';

const filterConfig: Array<{
  key: keyof DashboardFilters;
  label: string;
  optionKey: keyof FilterOptions;
}> = [
  { key: 'examCode', label: 'Exam Code', optionKey: 'examCodes' },
  { key: 'examDate', label: 'Exam Date', optionKey: 'examDates' },
  { key: 'session', label: 'Session', optionKey: 'sessions' },
  { key: 'centreId', label: 'Centre', optionKey: 'centreIds' },
  { key: 'subCentreId', label: 'Sub Centre', optionKey: 'subCentreIds' },
  { key: 'verificationMode', label: 'Verification Mode', optionKey: 'verificationModes' },
];

export const FilterBar = ({
  filters,
  options,
  onChange,
  onApply,
  onReset,
  isFetching,
  isDisabled,
  showReset,
}: FilterBarProps) => {
  const isReady = Boolean(options);

  return (
    <div className="mt-3 rounded-lg border border-neutral bg-surface-muted p-3 backdrop-blur md:p-4">
      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
        {filterConfig.map(({ key, label, optionKey }) => (
          <label
            key={key as string}
            className="flex flex-col gap-2 text-sm font-medium text-muted"
          >
            {label}
            {isReady ? (
              <select
                className={baseControlClasses}
                value={filters[key] ?? options![optionKey][0]}
                onChange={(event) => onChange({ ...filters, [key]: event.target.value })}
              >
                {options![optionKey].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            ) : (
              <div className="h-11 w-full animate-pulse rounded-xl bg-[rgba(148,163,184,0.25)]" />
            )}
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        {showReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-neutral px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-surface"
          >
            Reset
          </button>
        )}
        <button
          type="button"
          onClick={onApply}
          disabled={!isReady || isDisabled}
          className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-accent/50"
        >
          {isFetching ? 'Filtering…' : 'Apply Filters'}
        </button>
      </div>
    </div>
  );
};

