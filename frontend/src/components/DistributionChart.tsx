import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DistributionDatum } from '../types';
import { WidgetCard } from './WidgetCard';
import { formatCityDisplay } from '../utils/cityMapping';

interface DistributionChartProps {
  title: string;
  subtitle?: string;
  data: DistributionDatum[];
  layout?: 'horizontal' | 'vertical';
  maxItems?: number;
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
}

const Loader = () => (
  <div className="flex h-64 flex-col justify-between gap-4">
    {[...Array(5)].map((_, idx) => (
      <div key={idx} className="h-8 w-full rounded-2xl bg-[rgba(148,163,184,0.3)]" />
    ))}
  </div>
);

const ChartTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: DistributionDatum }>;
}) => {
  if (!active || !payload?.length) return null;
  const { payload: point } = payload[0] ?? {};
  const value = payload[0]?.value ?? 0;
  // Format label if it's a centre code (check if it's numeric and not already formatted)
  const label = point?.label ?? '-';
  const isCentreCode = /^\d+$/.test(label);
  const displayLabel = isCentreCode ? formatCityDisplay(label) : label;
  return (
    <div className="rounded-xl bg-surface px-4 py-2 text-sm shadow-lg">
      <p className="font-semibold text-primary">{displayLabel}</p>
      <p className="text-muted">{value.toLocaleString()} students</p>
    </div>
  );
};

export const DistributionChart = ({
  title,
  subtitle,
  data,
  layout = 'horizontal',
  maxItems,
  isLoading,
  error,
  emptyMessage = 'No records match the selected filters.',
}: DistributionChartProps) => {
  const trimmedData = maxItems ? data.slice(0, maxItems) : data;
  const hasData = trimmedData.length > 0;
  const isVerticalLayout = layout === 'vertical';
  
  // Format labels for "Candidates in each city" chart
  const formattedData = title === 'Candidates in each city'
    ? trimmedData.map(item => ({
        ...item,
        label: formatCityDisplay(item.label)
      }))
    : trimmedData;

  return (
    <WidgetCard
      title={title}
      subtitle={subtitle}
      status={
        error ? (
          <span className="text-red-400">Unable to refresh data. Showing last values.</span>
        ) : null
      }
    >
      {isLoading ? (
        <Loader />
      ) : !hasData ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart
              data={formattedData}
              layout={isVerticalLayout ? 'vertical' : 'horizontal'}
              margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              barSize={20}
            >
              <CartesianGrid
                horizontal={!isVerticalLayout}
                vertical={isVerticalLayout}
                stroke="var(--border-color)"
              />
              {isVerticalLayout ? (
                <>
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: 'var(--text-muted)' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={80}
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: 'var(--text-muted)' }}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: 'var(--text-muted)' }}
                    interval={0}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tick={{ fill: 'var(--text-muted)' }}
                  />
                </>
              )}
              <Tooltip content={<ChartTooltip />} />
              <Bar 
                dataKey="value" 
                fill="#1f4ed8" 
                radius={[4, 4, 0, 0]} 
                animationDuration={400}
                cursor="default"
                onClick={() => {}}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </WidgetCard>
  );
};

