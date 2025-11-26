
import { useEffect, useMemo, useState } from 'react';
import { StatCard, FilterBar, ComparisonChart, DonutChart, DistributionChart, DataTable } from './components';
import { useLiveData } from './hooks/useLiveData';
import type { DashboardFilters } from './types';
import { useTheme } from './context';
import { HiMoon, HiSun } from 'react-icons/hi2';

function App() {
  const [pendingFilters, setPendingFilters] = useState<DashboardFilters>({});
  const [activeFilters, setActiveFilters] = useState<DashboardFilters>({});
  const [defaultFilters, setDefaultFilters] = useState<DashboardFilters | null>(null);
  const { theme, toggleTheme } = useTheme();

  const { data, isLoading, error } = useLiveData(activeFilters);

  useEffect(() => {
    if (!data?.filters) return;
    const defaults: DashboardFilters = {
      examCode: data.filters.examCodes[0],
      examDate: data.filters.examDates[0],
      session: data.filters.sessions[0],
      centreId: data.filters.centreIds[0],
      subCentreId: data.filters.subCentreIds[0],
      verificationMode: data.filters.verificationModes[0],
    };

    const timeout = window.setTimeout(() => {
      setDefaultFilters(defaults);
      setPendingFilters((prev) =>
        Object.keys(prev).length ? prev : defaults,
      );
      setActiveFilters((prev) =>
        Object.keys(prev).length ? prev : defaults,
      );
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [data?.filters]);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Admitted candidates',
        value: data?.summary.totalAdmits ?? 0,
      },
      {
        label: 'Face authenticated candidates',
        value: data?.summary.automatedLogins ?? 0,
      },
      {
        label: 'Manually admitted candidates',
        value: data?.summary.manualLogins ?? 0,
      },
    ],
    [data?.summary],
  );

  const handleApplyFilters = () => {
    if (!data?.filters) return;
    setActiveFilters(pendingFilters);
  };

  const handleResetFilters = () => {
    if (!defaultFilters) return;
    setPendingFilters(defaultFilters);
    setActiveFilters(defaultFilters);
  };

  const hasCustomFilters =
    !!defaultFilters &&
    Object.keys(defaultFilters).some(
      (key) => activeFilters[key as keyof DashboardFilters] !== defaultFilters[key as keyof DashboardFilters],
    );

  return (
    <div className="bg-app px-3 py-4 text-primary transition-colors md:px-8 lg:px-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            UPSC Login Dashboard
          </h1>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex items-center justify-center rounded-full border border-neutral bg-surface p-2.5 text-primary transition hover:bg-surface-muted"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <HiMoon className="h-5 w-5" />
          ) : (
            <HiSun className="h-5 w-5" />
          )}
        </button>
      </header>

      <section className="mt-3 grid gap-2 md:grid-cols-3">
        {summaryCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            isLoading={isLoading}
          />
        ))}
      </section>

      <FilterBar
        filters={pendingFilters}
        options={data?.filters}
        onChange={setPendingFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        showReset={hasCustomFilters}
        isDisabled={!data?.filters}
      />

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <ComparisonChart
          data={data?.loginComparison ?? []}
          isLoading={isLoading || !data}
          error={error as Error | null}
        />
        <DonutChart
          data={data?.loginTypeShare ?? { automatedPercentage: 0, manualPercentage: 0 }}
          isLoading={isLoading || !data}
          error={error as Error | null}
        />
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-3">
        <DistributionChart
          title="Students per Centre"
          subtitle="Top centres by admit count"
          data={data?.studentsPerCentre ?? []}
          layout="vertical"
          maxItems={6}
          isLoading={isLoading || !data}
          error={error as Error | null}
        />
        <DistributionChart
          title="Number of Face authentications per Exam"
          subtitle="Most active exam codes"
          data={data?.studentsPerCourse ?? []}
          maxItems={6}
          isLoading={isLoading || !data}
          error={error as Error | null}
        />
        <DistributionChart
          title="Face Authentications Session wise"
          subtitle="Shift-wise admit totals"
          data={data?.studentsPerSession ?? []}
          maxItems={4}
          isLoading={isLoading || !data}
          error={error as Error | null}
        />
      </section>

      <section className="mt-4">
        <DataTable
          rows={data?.table ?? []}
          selectedExamCode={activeFilters.examCode}
          isLoading={isLoading || !data}
          error={error as Error | null}
        />
      </section>

      {data?.lastUpdated && (
        <p className="mt-6 text-xs text-muted">
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default App;

