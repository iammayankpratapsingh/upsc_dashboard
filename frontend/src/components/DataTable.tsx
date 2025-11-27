import type { TableRow } from '../types';
import { WidgetCard } from './WidgetCard';
import { formatExamCode } from '../services/api';
import { formatCityDisplay } from '../utils/cityMapping';

interface DataTableProps {
  rows: TableRow[];
  selectedExamCode?: string;
  isLoading?: boolean;
  error?: Error | null;
}

const numberFormatter = new Intl.NumberFormat('en-IN');

const stripLeadingZeros = (value: string) => {
  if (!value) return value;
  const trimmed = value.replace(/^0+/, '');
  return trimmed.length ? trimmed : '0';
};

// Extract raw exam code from formatted code (removes "PT ", "Mains " prefixes)
const extractRawExamCode = (formattedCode: string): string => {
  if (!formattedCode) return formattedCode;
  let rawCode = formattedCode.trim();
  if (rawCode.startsWith('PT ')) {
    rawCode = rawCode.substring(3);
  } else if (rawCode.startsWith('Mains ')) {
    rawCode = rawCode.substring(6);
  }
  return rawCode;
};

const buildDownloadUrl = (
  examDate: string,
  examCode: string,
  examSession: string,
  centreId: string,
  subCentreId: string,
) => {
  const normalizedCentre = stripLeadingZeros(centreId || '');
  const normalizedSubCentre = stripLeadingZeros(subCentreId || '');
  const rawExamCode = extractRawExamCode(examCode || '');
  
  // Build URL with all parameters
  const params = new URLSearchParams();
  if (examDate) params.append('date', examDate);
  if (rawExamCode) params.append('exam', rawExamCode);
  if (examSession) params.append('session', examSession);
  if (normalizedCentre) params.append('centre', normalizedCentre);
  if (normalizedSubCentre) params.append('subcentre', normalizedSubCentre);
  
  return `https://aviktechnosoft.com/dic/test.php?${params.toString()}`;
};

// Parse date string to timestamp, handling DD-MM-YYYY or YYYY-MM-DD formats
const parseDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  // Try to parse the date - handles formats like DD-MM-YYYY, YYYY-MM-DD, etc.
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // If format is DD-MM-YYYY, convert to YYYY-MM-DD for proper parsing
    if (parts[0].length === 2 && parts[2].length === 4) {
      const [day, month, year] = parts;
      const normalizedDate = `${year}-${month}-${day}`;
      const parsed = new Date(normalizedDate).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    // If format is already YYYY-MM-DD
    if (parts[0].length === 4) {
      const parsed = new Date(dateStr).getTime();
      if (!isNaN(parsed)) return parsed;
    }
  }
  // Fallback to standard Date parsing
  const parsed = new Date(dateStr).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

// Compare strings that might be numeric
const compareStrings = (a: string, b: string): number => {
  const numA = Number(a);
  const numB = Number(b);
  // If both are valid numbers, compare numerically
  if (!isNaN(numA) && !isNaN(numB) && a !== '' && b !== '') {
    return numA - numB;
  }
  // Otherwise compare alphabetically
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

export const DataTable = ({ rows, selectedExamCode, isLoading, error }: DataTableProps) => {
  const sortedRows = [...rows].sort((a, b) => {
    // Sort by date (latest first)
    const dateA = parseDate(a.examDate);
    const dateB = parseDate(b.examDate);
    if (dateB !== dateA) {
      return dateB - dateA;
    }
    // Then by center code
    if (a.centreId !== b.centreId) {
      return compareStrings(a.centreId, b.centreId);
    }
    // Then by sub center
    return compareStrings(a.subCentreId, b.subCentreId);
  });

  const normalizedExamCode = selectedExamCode?.trim();
  const shouldFilter =
    normalizedExamCode !== undefined &&
    normalizedExamCode.length > 0 &&
    !normalizedExamCode.toLowerCase().startsWith('all');

  const filteredRows = shouldFilter
    ? sortedRows.filter((row) => formatExamCode(row.examCode) === normalizedExamCode)
    : sortedRows;

  const hasNoRows = !isLoading && filteredRows.length === 0;

  return (
    <WidgetCard
      title="City wise candidates appeared"
      status={
        error ? (
          <span className="text-red-400">Unable to refresh data. Showing last values.</span>
        ) : null
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-primary">
          <thead>
            <tr className="text-xs uppercase text-muted">
              <th className="pb-4 pr-4 font-semibold">Exam Date</th>
              <th className="pb-4 pr-4 font-semibold">Name of the Examination</th>
              <th className="pb-4 pr-4 font-semibold">Session</th>
              <th className="pb-4 pr-4 font-semibold">City</th>
              <th className="pb-4 pr-4 font-semibold">Sub Centre</th>
              <th className="pb-4 pr-4 font-semibold">Verification Mode</th>
              <th className="pb-4 font-semibold">Admit Count</th>
              <th className="pb-4 pl-2 text-right font-semibold">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:rgba(148,163,184,0.25)]">
            {isLoading ? (
              [...Array(5)].map((_, idx) => (
                <tr key={idx} className="animate-pulse text-muted">
                  {[...Array(8)].map((__value, cellIdx) => (
                    <td key={cellIdx} className="py-3 pr-4">
                      <div className="h-4 w-24 rounded-full bg-[rgba(148,163,184,0.3)]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : hasNoRows ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-sm text-muted">
                  No cities match the selected exam code.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const formattedCode = formatExamCode(row.examCode);
                return (
                  <tr
                    key={`${row.examCode}-${row.examDate}-${row.examSession}-${row.centreId}-${row.subCentreId}-${row.verificationMode}`}
                    className="text-primary"
                  >
                    <td className="py-4 pr-4">{row.examDate}</td>
                    <td className="py-4 pr-4 font-semibold">{formattedCode}</td>
                    <td className="py-4 pr-4">{row.examSession}</td>
                    <td className="py-4 pr-4">{formatCityDisplay(row.centreId)}</td>
                    <td className="py-4 pr-4 text-muted">{row.subCentreId}</td>
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          row.verificationMode === 'A'
                            ? 'bg-chart-automated/15 text-chart-automated'
                            : 'bg-chart-manual/20 text-chart-manual'
                        }`}
                      >
                        {row.verificationMode === 'A' ? 'Automated' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-4 font-semibold">
                      {numberFormatter.format(row.admitCount)}
                    </td>
                    <td className="py-4 pl-2 text-right">
                      <a
                        href={buildDownloadUrl(
                          row.examDate,
                          row.examCode,
                          row.examSession,
                          row.centreId,
                          row.subCentreId,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-lg border border-neutral px-3 py-1 text-xs font-semibold text-primary transition hover:bg-surface"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
      </table>
    </div>
  </WidgetCard>
  );
};

