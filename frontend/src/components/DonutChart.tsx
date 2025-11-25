import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';
import type { LoginTypeShare } from '../types';
import { WidgetCard } from './WidgetCard';

interface DonutChartProps {
  data: LoginTypeShare;
  isLoading?: boolean;
  isFetching?: boolean;
  error?: Error | null;
}

const COLORS = ['#1f4ed8', '#97b0ff'];

export const DonutChart = ({ data, isLoading, isFetching, error }: DonutChartProps) => {
  const chartData = [
    { name: 'Automated', value: data.automatedPercentage },
    { name: 'Manual', value: data.manualPercentage },
  ];

  return (
    <WidgetCard
      title="Logins by Type"
      subtitle="Share of all logins"
      isFetching={isFetching}
      status={
        error ? (
          <span className="text-red-400">Unable to refresh data. Showing last values.</span>
        ) : (
          <span className="text-sm text-muted">
            Automated {data.automatedPercentage}% · Manual {data.manualPercentage}%
          </span>
        )
      }
    >
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-36 w-36 animate-pulse rounded-full border-8 border-[color:rgba(148,163,184,0.35)]" />
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-6 md:flex-row">
          <div className="h-48 w-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-4">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-3">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <div>
                  <p className="text-sm font-semibold text-primary">{entry.name}</p>
                  <p className="text-sm text-muted">{entry.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  );
};

