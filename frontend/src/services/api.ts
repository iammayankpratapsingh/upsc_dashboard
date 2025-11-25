import type { ApiRecord, DashboardData, DashboardFilters, FilterOptions } from '../types';

const DASHBOARD_STATS_API =
  import.meta.env.VITE_DASHBOARD_STATS_API ?? '/api/dashboard-stats';
const API_TIMEOUT = 10_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isAll = (value?: string) =>
  !value || value.toLowerCase().startsWith('all') || value === '';

const applyFilters = (records: ApiRecord[], filters?: DashboardFilters) =>
  records.filter((record) => {
    if (filters?.examCode && !isAll(filters.examCode) && record.upsc_exam_code !== filters.examCode)
      return false;
    if (filters?.examDate && !isAll(filters.examDate) && record.exam_date !== filters.examDate)
      return false;
    if (filters?.session && !isAll(filters.session) && record.exam_session !== filters.session)
      return false;
    if (filters?.centreId && !isAll(filters.centreId) && record.centre_id !== filters.centreId)
      return false;
    if (
      filters?.subCentreId &&
      !isAll(filters.subCentreId) &&
      record.sub_centre_id !== filters.subCentreId
    )
      return false;
    if (
      filters?.verificationMode &&
      !isAll(filters.verificationMode) &&
      record.verification_mode !== filters.verificationMode
    )
      return false;
    return true;
  });

const buildFilterOptions = (records: ApiRecord[]) => {
  const unique = <T extends string>(values: T[], label: string) => [
    label,
    ...Array.from(new Set(values)).sort(),
  ];

  return {
    examCodes: unique(records.map((item) => item.upsc_exam_code), 'All Exam Codes'),
    examDates: unique(records.map((item) => item.exam_date), 'All Dates'),
    sessions: unique(records.map((item) => item.exam_session), 'All Sessions'),
    centreIds: unique(records.map((item) => item.centre_id), 'All Centres'),
    subCentreIds: unique(records.map((item) => item.sub_centre_id), 'All Sub Centres'),
    verificationModes: unique(
      records.map((item) => item.verification_mode),
      'All Modes',
    ),
  };
};

interface DashboardStatsResponse {
  status: string;
  code: number;
  message: string;
  request_id: string;
  datetime: string;
  fetched_at?: string;
  data?: {
    last_updated?: string;
    stats?: ApiRecord[];
  };
}

interface DashboardStatsResult {
  records: ApiRecord[];
  lastUpdated: string;
}

const normalizeDate = (date?: string) => (date ? date.replaceAll('/', '-') : '');

const mapStatsToRecords = (stats?: ApiRecord[]) =>
  (stats ?? []).map((stat) => ({
    ...stat,
    exam_date: normalizeDate(stat.exam_date),
  }));

const fetchDashboardStats = async (
  controller: AbortController,
): Promise<DashboardStatsResult> => {
  const response = await fetch(DASHBOARD_STATS_API, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(`Proxy responded with status ${response.status}`);
  }

  const parsed = (await response.json()) as DashboardStatsResponse;
  if (parsed.status !== 'success') {
    throw new Error(parsed.message || 'Dashboard stats proxy error');
  }

  const fetchedAt = parsed.fetched_at ?? parsed.data?.last_updated ?? new Date().toISOString();

  return {
    records: mapStatsToRecords(parsed.data?.stats),
    lastUpdated: fetchedAt,
  };
};

const createEmptyFilters = (): FilterOptions => ({
  examCodes: ['All Exam Codes'],
  examDates: ['All Dates'],
  sessions: ['All Sessions'],
  centreIds: ['All Centres'],
  subCentreIds: ['All Sub Centres'],
  verificationModes: ['All Modes'],
});

const createEmptyDashboardData = (filters?: FilterOptions, lastUpdated?: string): DashboardData => ({
  summary: {
    totalAdmits: 0,
    automatedLogins: 0,
    manualLogins: 0,
  },
  loginComparison: [],
  loginTypeShare: {
    automatedPercentage: 0,
    manualPercentage: 0,
  },
  studentsPerCentre: [],
  studentsPerCourse: [],
  studentsPerSession: [],
  table: [],
  filters: filters ?? createEmptyFilters(),
  lastUpdated: lastUpdated ?? new Date().toISOString(),
});

const toDashboardData = (
  records: ApiRecord[],
  filters?: DashboardFilters,
  lastUpdated?: string,
): DashboardData => {
  if (!records.length) {
    return createEmptyDashboardData(undefined, lastUpdated);
  }

  const filtered = applyFilters(records, filters);
  const totalAdmits = filtered.reduce((sum, row) => sum + row.admit_count, 0);
  const automatedLogins = filtered
    .filter((row) => row.verification_mode === 'A')
    .reduce((sum, row) => sum + row.admit_count, 0);
  const manualLogins = filtered
    .filter((row) => row.verification_mode === 'M')
    .reduce((sum, row) => sum + row.admit_count, 0);

  const loginComparison = filtered.reduce<Record<string, { automated: number; manual: number }>>(
    (acc, row) => {
      const bucket = acc[row.centre_id] ?? { automated: 0, manual: 0 };
      if (row.verification_mode === 'A') {
        bucket.automated += row.admit_count;
      } else {
        bucket.manual += row.admit_count;
      }
      acc[row.centre_id] = bucket;
      return acc;
    },
    {},
  );

  const table = filtered.map((row) => ({
    examCode: row.upsc_exam_code,
    examDate: row.exam_date,
    examSession: row.exam_session,
    centreId: row.centre_id,
    subCentreId: row.sub_centre_id,
    verificationMode: row.verification_mode,
    admitCount: row.admit_count,
  }));

  const totalForShare = totalAdmits || 1;

  const increment = (bucket: Record<string, number>, key: string, value: number) => {
    bucket[key] = (bucket[key] ?? 0) + value;
  };

  const { centreTotals, courseTotals, sessionTotals } = filtered.reduce(
    (acc, row) => {
      increment(acc.centreTotals, row.centre_id, row.admit_count);
      increment(acc.courseTotals, row.upsc_exam_code, row.admit_count);
      increment(acc.sessionTotals, row.exam_session, row.admit_count);
      return acc;
    },
    {
      centreTotals: {} as Record<string, number>,
      courseTotals: {} as Record<string, number>,
      sessionTotals: {} as Record<string, number>,
    },
  );

  const toDistribution = (map: Record<string, number>) =>
    Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

  return {
    summary: {
      totalAdmits,
      automatedLogins,
      manualLogins,
    },
    loginComparison: Object.entries(loginComparison).map(([centreId, values]) => ({
      centreId,
      automated: values.automated,
      manual: values.manual,
    })),
    loginTypeShare: {
      automatedPercentage: Math.round((automatedLogins / totalForShare) * 100),
      manualPercentage: Math.round((manualLogins / totalForShare) * 100),
    },
    studentsPerCentre: toDistribution(centreTotals),
    studentsPerCourse: toDistribution(courseTotals),
    studentsPerSession: toDistribution(sessionTotals),
    table,
    filters: buildFilterOptions(records),
    lastUpdated: lastUpdated ?? new Date().toISOString(),
  };
};

export const fetchDashboardData = async (
  filters?: DashboardFilters,
): Promise<DashboardData> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const { records, lastUpdated } = await fetchDashboardStats(controller);
    if (!records.length) {
      return createEmptyDashboardData(undefined, lastUpdated);
    }

    return toDashboardData(records, filters, lastUpdated);
  } catch (error) {
    console.error('fetchDashboardData error', error);
    await wait(500);
    return createEmptyDashboardData();
  } finally {
    clearTimeout(timeout);
  }
};

