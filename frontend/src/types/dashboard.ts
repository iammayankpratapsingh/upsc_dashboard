export interface SummaryStats {
  totalAdmits: number;
  automatedLogins: number;
  manualLogins: number;
}

export interface LoginComparisonItem {
  centreId: string;
  automated: number;
  manual: number;
}

export interface LoginTypeShare {
  automatedPercentage: number;
  manualPercentage: number;
}

export interface DistributionDatum {
  label: string;
  value: number;
}

export interface TableRow {
  examCode: string;
  examDate: string;
  examSession: string;
  centreId: string;
  subCentreId: string;
  verificationMode: string;
  admitCount: number;
}

export interface FilterOptions {
  examCodes: string[];
  examDates: string[];
  sessions: string[];
  centreIds: string[];
  subCentreIds: string[];
  verificationModes: string[];
}

export interface DashboardFilters {
  examCode?: string;
  examDate?: string;
  session?: string;
  centreId?: string;
  subCentreId?: string;
  verificationMode?: string;
}

export interface DashboardData {
  summary: SummaryStats;
  loginComparison: LoginComparisonItem[];
  loginTypeShare: LoginTypeShare;
  studentsPerCentre: DistributionDatum[];
  studentsPerCourse: DistributionDatum[];
  studentsPerSession: DistributionDatum[];
  table: TableRow[];
  filters: FilterOptions;
  lastUpdated: string;
}

export interface ApiRecord {
  upsc_exam_code: string;
  exam_date: string;
  exam_session: string;
  centre_id: string;
  sub_centre_id: string;
  verification_mode: 'A' | 'M';
  admit_count: number;
}

