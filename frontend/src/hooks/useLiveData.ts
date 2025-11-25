import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  DashboardData,
  DashboardFilters,
  DistributionDatum,
  LoginComparisonItem,
  TableRow,
} from '../types';
import { fetchDashboardData } from '../services/api';

const isSummaryEqual = (prev: DashboardData['summary'], next: DashboardData['summary']) =>
  prev.totalAdmits === next.totalAdmits &&
  prev.automatedLogins === next.automatedLogins &&
  prev.manualLogins === next.manualLogins;

const isComparisonEqual = (
  prev: LoginComparisonItem[],
  next: LoginComparisonItem[],
) =>
  prev.length === next.length &&
  prev.every(
    (item, index) =>
      item.centreId === next[index]?.centreId &&
      item.automated === next[index]?.automated &&
      item.manual === next[index]?.manual,
  );

const isShareEqual = (
  prev: DashboardData['loginTypeShare'],
  next: DashboardData['loginTypeShare'],
) =>
  prev.automatedPercentage === next.automatedPercentage &&
  prev.manualPercentage === next.manualPercentage;

const isTableEqual = (prev: TableRow[], next: TableRow[]) =>
  prev.length === next.length &&
  prev.every((row, idx) => JSON.stringify(row) === JSON.stringify(next[idx]));

const isDistributionEqual = (prev: DistributionDatum[], next: DistributionDatum[]) =>
  prev.length === next.length &&
  prev.every(
    (item, index) => item.label === next[index]?.label && item.value === next[index]?.value,
  );

const isFilterEqual = (prev: string[], next: string[]) =>
  prev.length === next.length && prev.every((value, idx) => value === next[idx]);

const mergeDashboardData = (
  previous: DashboardData | null,
  incoming: DashboardData,
): DashboardData => {
  if (!previous) return incoming;
  const summarySame = isSummaryEqual(previous.summary, incoming.summary);
  const comparisonSame = isComparisonEqual(previous.loginComparison, incoming.loginComparison);
  const shareSame = isShareEqual(previous.loginTypeShare, incoming.loginTypeShare);
  const centreSame = isDistributionEqual(previous.studentsPerCentre, incoming.studentsPerCentre);
  const courseSame = isDistributionEqual(previous.studentsPerCourse, incoming.studentsPerCourse);
  const sessionSame = isDistributionEqual(previous.studentsPerSession, incoming.studentsPerSession);
  const tableSame = isTableEqual(previous.table, incoming.table);
  const filtersSame =
    isFilterEqual(previous.filters.examCodes, incoming.filters.examCodes) &&
    isFilterEqual(previous.filters.examDates, incoming.filters.examDates) &&
    isFilterEqual(previous.filters.sessions, incoming.filters.sessions) &&
    isFilterEqual(previous.filters.centreIds, incoming.filters.centreIds) &&
    isFilterEqual(previous.filters.subCentreIds, incoming.filters.subCentreIds) &&
    isFilterEqual(previous.filters.verificationModes, incoming.filters.verificationModes);
  const updatedSame = previous.lastUpdated === incoming.lastUpdated;

  if (summarySame && comparisonSame && shareSame && tableSame && filtersSame && updatedSame) {
    return previous;
  }

  return {
    summary: summarySame ? previous.summary : incoming.summary,
    loginComparison: comparisonSame ? previous.loginComparison : incoming.loginComparison,
    loginTypeShare: shareSame ? previous.loginTypeShare : incoming.loginTypeShare,
    studentsPerCentre: centreSame ? previous.studentsPerCentre : incoming.studentsPerCentre,
    studentsPerCourse: courseSame ? previous.studentsPerCourse : incoming.studentsPerCourse,
    studentsPerSession: sessionSame ? previous.studentsPerSession : incoming.studentsPerSession,
    table: tableSame ? previous.table : incoming.table,
    filters: filtersSame ? previous.filters : incoming.filters,
    lastUpdated: updatedSame ? previous.lastUpdated : incoming.lastUpdated,
  };
};

export const useLiveData = (filters?: DashboardFilters) => {
  const [stableData, setStableData] = useState<DashboardData | null>(null);

  const query = useQuery<DashboardData, Error>({
    queryKey: ['dashboard', filters],
    queryFn: () => fetchDashboardData(filters),
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  useEffect(() => {
    if (!query.data) return;
    const timeout = window.setTimeout(() => {
      setStableData((prev) => mergeDashboardData(prev, query.data!));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [query.data]);

  return {
    data: stableData,
    isLoading: !stableData && (query.isLoading || query.isFetching),
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};

