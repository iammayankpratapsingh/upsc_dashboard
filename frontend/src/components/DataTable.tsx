import type { TableRow } from '../types';
import { WidgetCard } from './WidgetCard';

interface DataTableProps {
  rows: TableRow[];
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
}

const numberFormatter = new Intl.NumberFormat('en-IN');

export const DataTable = ({ rows, isLoading, isFetching, error }: DataTableProps) => (
  <WidgetCard
    title="Exam Center Performance"
    subtitle="Students appeared vs. login types"
    isFetching={isFetching}
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
            <th className="pb-4 pr-4 font-semibold">Exam Code</th>
            <th className="pb-4 pr-4 font-semibold">Exam Date</th>
            <th className="pb-4 pr-4 font-semibold">Session</th>
            <th className="pb-4 pr-4 font-semibold">Centre</th>
            <th className="pb-4 pr-4 font-semibold">Sub Centre</th>
            <th className="pb-4 pr-4 font-semibold">Verification Mode</th>
            <th className="pb-4 font-semibold">Admit Count</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:rgba(148,163,184,0.25)]">
          {isLoading
            ? [...Array(5)].map((_, idx) => (
                <tr key={idx} className="animate-pulse text-muted">
                  {[...Array(7)].map((__value, cellIdx) => (
                    <td key={cellIdx} className="py-3 pr-4">
                      <div className="h-4 w-24 rounded-full bg-[rgba(148,163,184,0.3)]" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr
                  key={`${row.examCode}-${row.examDate}-${row.centreId}-${row.subCentreId}-${row.verificationMode}`}
                  className="text-primary"
                >
                  <td className="py-4 pr-4 font-semibold">{row.examCode}</td>
                  <td className="py-4 pr-4">{row.examDate}</td>
                  <td className="py-4 pr-4">{row.examSession}</td>
                  <td className="py-4 pr-4">{row.centreId}</td>
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
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  </WidgetCard>
);

