import type { DashboardFilters, FilterOptions } from '../types';

interface FilterBarProps {
  filters: DashboardFilters;
  options?: FilterOptions;
  onChange: (next: DashboardFilters) => void;
  onApply: () => void;
  onReset?: () => void;
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
  isDisabled,
  showReset,
}: FilterBarProps) => {
  const isReady = Boolean(options);

  // Get raw exam code from formatted exam code
  const getRawExamCode = (formattedCode: string): string => {
    if (!options?._examCodeMap || formattedCode === 'All Exam Codes') {
      return formattedCode;
    }
    return options._examCodeMap.get(formattedCode) || formattedCode;
  };

  // Check if selected exam code is PT
  const isPTExam = (): boolean => {
    const selectedCode = filters.examCode;
    if (!selectedCode || selectedCode === 'All Exam Codes') return false;
    const rawCode = getRawExamCode(selectedCode);
    return rawCode.startsWith('CMS') || rawCode.startsWith('ESE') || rawCode.startsWith('PT') || 
           rawCode.match(/^(CMS|ESE|NDA|CDS)/i) !== null;
  };

  // Get filtered dates based on selected exam
  const getFilteredDates = (): string[] => {
    if (!options || !filters.examCode || filters.examCode === 'All Exam Codes') {
      return options?.examDates || [];
    }
    const rawCode = getRawExamCode(filters.examCode);
    const datesSet = options._examCodeToDates?.get(rawCode);
    if (!datesSet) return options.examDates || [];
    return ['All Dates', ...Array.from(datesSet).sort()];
  };

  // Get filtered subcenters based on exam code
  const getFilteredSubCenters = (): string[] => {
    if (!options) return [];
    const allSubCenters = options.subCentreIds || [];
    if (isPTExam()) {
      return allSubCenters;
    }
    // Filter out subcenter 000 when not PT, but keep "All Sub Centres"
    const filtered = allSubCenters.filter((sc) => sc !== '000');
    return filtered.length > 0 ? filtered : allSubCenters;
  };

  const filteredDates = getFilteredDates();
  const filteredSubCenters = getFilteredSubCenters();

  return (
    <div className="mt-3 rounded-lg border border-neutral bg-surface-muted p-3 backdrop-blur md:p-4">
      <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
        {filterConfig.map(({ key, label, optionKey }) => {
          let displayOptions: string[] = [];
          
          // Override for dates dropdown
          if (key === 'examDate' && isReady) {
            displayOptions = filteredDates;
          } else if (key === 'subCentreId' && isReady) {
            // Override for subcenter dropdown
            displayOptions = filteredSubCenters;
          } else {
            // Default: get from options
            const optionValue = options?.[optionKey];
            // Ensure we only use string arrays, not Maps or other types
            if (Array.isArray(optionValue) && optionValue.length > 0 && typeof optionValue[0] === 'string') {
              displayOptions = optionValue as string[];
            } else {
              displayOptions = [];
            }
          }

          return (
            <label
              key={key as string}
              className="flex flex-col gap-2 text-sm font-medium text-muted"
            >
              {label}
              {isReady ? (
                <select
                  className={baseControlClasses}
                  value={filters[key] ?? displayOptions[0] ?? ''}
                  onChange={(event) => {
                    const newFilters = { ...filters, [key]: event.target.value };
                    // Reset dependent filters when exam code changes
                    if (key === 'examCode') {
                      newFilters.examDate = 'All Dates';
                      newFilters.subCentreId = 'All Sub Centres';
                    }
                    onChange(newFilters);
                  }}
                >
                  {displayOptions.map((value: string) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="h-11 w-full animate-pulse rounded-xl bg-[rgba(148,163,184,0.25)]" />
              )}
            </label>
          );
        })}
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
          Apply Filters
        </button>
      </div>
    </div>
  );
};

