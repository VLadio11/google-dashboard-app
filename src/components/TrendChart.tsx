import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TimeSeriesPoint } from '../types';
import { formatDateShort } from '../utils/dates';

interface TrendChartProps {
  data: TimeSeriesPoint[];
}

interface TickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

function ShortDateTick({ x = 0, y = 0, payload }: TickProps) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill="#5f6368"
        fontSize={11}
      >
        {payload ? formatDateShort(payload.value) : ''}
      </text>
    </g>
  );
}

export default function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) return null;

  // Thin out labels when there are many data points
  const tickInterval = data.length > 30 ? Math.ceil(data.length / 10) - 1 : 'preserveStartEnd';

  return (
    <div className="chart-card">
      <h3 className="table-title">Sessions &amp; Users Over Time</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={<ShortDateTick />}
            interval={tickInterval}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#5f6368' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #dadce0',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name === 'sessions' ? 'Sessions' : 'Active Users',
            ]}
            labelFormatter={(label: string) => formatDateShort(label)}
          />
          <Legend
            formatter={(value: string) => (value === 'sessions' ? 'Sessions' : 'Active Users')}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="sessions"
            stroke="#1a73e8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="activeUsers"
            stroke="#34a853"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
