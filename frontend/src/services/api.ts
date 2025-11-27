import type { ApiRecord, DashboardData, DashboardFilters, FilterOptions } from '../types';

// Backend API URL - directly configured
const DASHBOARD_STATS_API = 'https://aviktechnosoft.com/dic/data.php';
const API_TIMEOUT = 10_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isAll = (value?: string) =>
  !value || value.toLowerCase().startsWith('all') || value === '';

export const formatExamCode = (code: string): string => {
  // Add prefixes based on exam code patterns
  if (code.startsWith('CMS') || code.startsWith('ESE')) {
    return `PT ${code}`;
  }
  if (code.includes('IFS') && code.includes('Mains')) {
    return `Mains ${code}`;
  }
  // Check if it's a PT exam (starts with common PT patterns)
  if (code.match(/^(CMS|ESE|NDA|CDS)/i)) {
    return `PT ${code}`;
  }
  // Check if it's a Mains exam
  if (code.match(/IFS/i) && !code.startsWith('PT')) {
    return `Mains ${code}`;
  }
  return code;
};

const buildFilterOptions = (records: ApiRecord[]) => {
  const unique = <T extends string>(values: T[], label: string) => [
    label,
    ...Array.from(new Set(values)).sort(),
  ];

  // Sort dates in descending order (latest first)
  const sortDatesDesc = (dates: string[]): string[] => {
    return dates.sort((a, b) => {
      // Parse dates - handle DD-MM-YYYY or YYYY-MM-DD format
      const parseDate = (dateStr: string): number => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          // If format is DD-MM-YYYY, convert to YYYY-MM-DD for proper parsing
          if (parts[0].length === 2 && parts[2].length === 4) {
            const [day, month, year] = parts;
            const normalizedDate = `${year}-${month}-${day}`;
            return new Date(normalizedDate).getTime();
          }
          // If format is already YYYY-MM-DD
          if (parts[0].length === 4) {
            return new Date(dateStr).getTime();
          }
        }
        return new Date(dateStr).getTime();
      };
      return parseDate(b) - parseDate(a); // Descending order
    });
  };

  // Sort sessions with FN first, then AN
  const sortSessions = (sessions: string[]): string[] => {
    return sessions.sort((a, b) => {
      if (a === 'FN' && b !== 'FN') return -1;
      if (a !== 'FN' && b === 'FN') return 1;
      if (a === 'AN' && b !== 'AN') return -1;
      if (a !== 'AN' && b === 'AN') return 1;
      return a.localeCompare(b);
    });
  };

  // Create exam code to dates mapping for filtering
  const examCodeToDates = new Map<string, Set<string>>();
  records.forEach((record) => {
    const code = record.upsc_exam_code;
    if (!examCodeToDates.has(code)) {
      examCodeToDates.set(code, new Set());
    }
    examCodeToDates.get(code)!.add(record.exam_date);
  });

  // Format exam codes with prefixes
  const rawExamCodes = Array.from(new Set(records.map((item) => item.upsc_exam_code))).sort();
  const formattedExamCodes = rawExamCodes.map((code) => formatExamCode(code));
  const examCodeMap = new Map<string, string>(); // formatted -> raw
  rawExamCodes.forEach((raw, idx) => {
    examCodeMap.set(formattedExamCodes[idx], raw);
  });

  // Get unique dates and sort in descending order
  const uniqueDates = Array.from(new Set(records.map((item) => item.exam_date)));
  const sortedDates = sortDatesDesc(uniqueDates);

  // Get unique sessions and sort with FN first
  const uniqueSessions = Array.from(new Set(records.map((item) => item.exam_session)));
  const sortedSessions = sortSessions(uniqueSessions);

  return {
    examCodes: ['All Exam Codes', ...formattedExamCodes],
    examDates: ['All Dates', ...sortedDates],
    sessions: ['All Sessions', ...sortedSessions],
    centreIds: unique(records.map((item) => item.centre_id), 'All Cities'),
    subCentreIds: unique(records.map((item) => item.sub_centre_id), 'All Sub Centres'),
    verificationModes: unique(
      records.map((item) => item.verification_mode),
      'All Modes',
    ),
    // Store mappings for filtering
    _examCodeMap: examCodeMap,
    _examCodeToDates: examCodeToDates,
    _rawRecords: records,
  };
};

interface LegacyDashboardStatsResponse {
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

interface SimpleDashboardStatsResponse {
  success?: boolean;
  error?: string;
  message?: string;
  last_updated?: string;
  count?: number;
  filters_used?: Record<string, unknown>;
  // Different possible containers for records depending on API version
  data?: ApiRecord[] | { stats?: ApiRecord[] };
  results?: ApiRecord[];
  stats?: ApiRecord[];
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

// Extract raw exam code from formatted code (removes "PT ", "Mains " prefixes)
const extractRawExamCode = (formattedCode?: string): string | undefined => {
  if (!formattedCode || isAll(formattedCode)) return undefined;
  
  // Remove common prefixes
  let rawCode = formattedCode.trim();
  if (rawCode.startsWith('PT ')) {
    rawCode = rawCode.substring(3);
  } else if (rawCode.startsWith('Mains ')) {
    rawCode = rawCode.substring(6);
  }
  
  return rawCode;
};

const buildApiFilterPayload = (filters?: DashboardFilters) => {
  const payload: Record<string, unknown> = {};

  if (!filters) return payload;

  // Send all filters to API - API will handle filtering server-side
  if (filters.examCode && !isAll(filters.examCode)) {
    const rawExamCode = extractRawExamCode(filters.examCode);
    if (rawExamCode) {
      payload.upsc_exam_code = rawExamCode;
    }
  }
  if (filters.examDate && !isAll(filters.examDate)) {
    payload.exam_date = filters.examDate;
  }
  if (filters.session && !isAll(filters.session)) {
    payload.exam_session = filters.session;
  }
  if (filters.centreId && !isAll(filters.centreId)) {
    payload.centre_id = filters.centreId;
  }
  if (filters.subCentreId && !isAll(filters.subCentreId)) {
    payload.sub_centre_id = filters.subCentreId;
  }
  if (filters.verificationMode && !isAll(filters.verificationMode)) {
    payload.verification_mode = filters.verificationMode;
  }

  return payload;
};

const extractRecordsFromResponse = (
  parsed: unknown,
): { records: ApiRecord[]; lastUpdated?: string } => {
  let records: ApiRecord[] = [];
  let lastUpdated: string | undefined;

  // Case 1: API returns plain array of records
  if (Array.isArray(parsed)) {
    records = parsed as ApiRecord[];
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as SimpleDashboardStatsResponse & LegacyDashboardStatsResponse;

    // Case 2: New simple API: { success, results: [...] }
    if (Array.isArray(obj.results)) {
      records = obj.results as ApiRecord[];
      lastUpdated = obj.last_updated;
    } else if (Array.isArray(obj.data)) {
      // Case 3: { data: [...] }
      records = obj.data as ApiRecord[];
      lastUpdated = obj.last_updated;
    } else if (obj.data && Array.isArray((obj.data as any).stats)) {
      // Case 4: data.stats[]
      records = (obj.data as any).stats as ApiRecord[];
      lastUpdated = obj.last_updated ?? obj.data.last_updated;
    } else if (Array.isArray((obj as any).stats)) {
      // Case 5: { stats: [...] }
      records = (obj as any).stats as ApiRecord[];
      lastUpdated = obj.last_updated;
    } else if ('status' in obj && (obj as LegacyDashboardStatsResponse).status === 'success') {
      // Case 6: Legacy proxy response
      const legacy = obj as LegacyDashboardStatsResponse;
      records = legacy.data?.stats ?? [];
      lastUpdated = legacy.fetched_at ?? legacy.data?.last_updated;
    } else if ('success' in obj && obj.success === false) {
      // Explicit error from simple API
      throw new Error(obj.error || 'Dashboard API returned an error');
    }
  }

  if (!records || !Array.isArray(records)) {
    throw new Error('Dashboard API response did not contain stats data');
  }

  return { records, lastUpdated };
};

const fetchDashboardStats = async (
  controller: AbortController,
  filters?: DashboardFilters,
): Promise<DashboardStatsResult> => {
  const response = await fetch(DASHBOARD_STATS_API, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildApiFilterPayload(filters)),
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(`Dashboard API responded with status ${response.status}`);
  }

  const parsed = await response.json();
  const { records } = extractRecordsFromResponse(parsed);

  // Use current frontend time when API call completes (real-time fetch timestamp)
  const fetchTimestamp = new Date().toISOString();

  return {
    records: mapStatsToRecords(records),
    lastUpdated: fetchTimestamp,
  };
};

const createEmptyFilters = (): FilterOptions => ({
  examCodes: ['All Exam Codes'],
  examDates: ['All Dates'],
  sessions: ['All Sessions'],
    centreIds: ['All Cities'],
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
  lastUpdated?: string,
): DashboardData => {
  if (!records.length) {
    return createEmptyDashboardData(undefined, lastUpdated);
  }

  // API returns filtered results, so use records directly without client-side filtering
  // Build filter options from the returned records (these will be the available options for the filtered dataset)
  const filterOptions = buildFilterOptions(records);
  
  // Calculate statistics from the API-filtered records
  const totalAdmits = records.reduce((sum, row) => sum + row.admit_count, 0);
  const automatedLogins = records
    .filter((row) => row.verification_mode === 'A')
    .reduce((sum, row) => sum + row.admit_count, 0);
  const manualLogins = records
    .filter((row) => row.verification_mode === 'M')
    .reduce((sum, row) => sum + row.admit_count, 0);

  const loginComparison = records.reduce<Record<string, { automated: number; manual: number }>>(
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

  // Table shows only the filtered records returned by API
  const table = records.map((row) => ({
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

  const { centreTotals, courseTotals, sessionTotals } = records.reduce(
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
    filters: filterOptions,
    lastUpdated: lastUpdated ?? new Date().toISOString(),
  };
};

export const fetchDashboardData = async (
  filters?: DashboardFilters,
): Promise<DashboardData> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const { records, lastUpdated } = await fetchDashboardStats(controller, filters);
    if (!records.length) {
      return createEmptyDashboardData(undefined, lastUpdated);
    }

    return toDashboardData(records, lastUpdated);
  } catch (error) {
    console.error('fetchDashboardData error', error);
    await wait(500);
    return createEmptyDashboardData();
  } finally {
    clearTimeout(timeout);
  }
};

