import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LoginComparisonItem } from '../types';
import { WidgetCard } from './WidgetCard';
import { formatCityDisplay } from '../utils/cityMapping';

interface ComparisonChartProps {
  data: LoginComparisonItem[];
  isLoading?: boolean;
  error?: Error | null;
}

const ChartTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; payload?: LoginComparisonItem }>;
}) => {
  const typedPayload = payload ?? [];
  if (!active || typedPayload.length === 0) return null;
  const point = typedPayload[0]?.payload;
  const automatedValue =
    typedPayload.find((item) => item.dataKey === 'automated')?.value ?? 0;
  const manualValue = typedPayload.find((item) => item.dataKey === 'manual')?.value ?? 0;
  const cityDisplay = point?.centreId ? formatCityDisplay(point.centreId) : '-';
  return (
    <div className="rounded-xl bg-surface px-4 py-2 text-sm shadow-lg">
      <p className="font-semibold text-primary">City {cityDisplay}</p>
      <p className="text-chart-automated">Automated: {automatedValue}</p>
      <p className="text-chart-manual">Manual: {manualValue}</p>
    </div>
  );
};

const CityCodeTick = ({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) => {
  if (!payload?.value) return null;
  const display = formatCityDisplay(payload.value);
  const match = display.match(/^(.*)\s\((.*)\)$/);
  const cityName = match ? match[1] : display;
  const centreCode = match ? match[2] : '';

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill="var(--text-muted)" fontSize={10}>
        <tspan x={0} dy={0}>
          {cityName}
        </tspan>
        {centreCode && (
          <tspan x={0} dy={12} fontSize={9}>
            {centreCode}
          </tspan>
        )}
      </text>
    </g>
  );
};

export const ComparisonChart = ({
  data,
  isLoading,
  error,
}: ComparisonChartProps) => {
  const sortedData = [...(data || [])].sort((a, b) => 
    a.centreId.localeCompare(b.centreId)
  );

  return (
    <WidgetCard
      title="Face authentication vs Manual Admissions"
      status={
        error ? (
          <span className="text-red-400">Unable to refresh data. Showing last values.</span>
        ) : null
      }
    >
      {isLoading ? (
        <div className="flex h-64 flex-col justify-between gap-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-10 w-full rounded-2xl bg-[rgba(148,163,184,0.3)]" />
          ))}
        </div>
      ) : (
        <div className="w-full">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                margin={{ top: 16, right: 24, left: 16, bottom: 36 }}
                barSize={14}
              >
                <CartesianGrid vertical={false} stroke="var(--border-color)" />
                <XAxis
                  type="category"
                  dataKey="centreId"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickMargin={16}
                  tick={<CityCodeTick />}
                />
                <YAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar
                  dataKey="automated"
                  fill="#1f4ed8"
                  radius={[8, 8, 0, 0]}
                  animationDuration={400}
                  cursor="default"
                  onClick={() => {}}
                />
                <Bar
                  dataKey="manual"
                  fill="#97b0ff"
                  radius={[8, 8, 0, 0]}
                  animationDuration={400}
                  cursor="default"
                  onClick={() => {}}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
  </WidgetCard>
  );
};

