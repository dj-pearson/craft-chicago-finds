/**
 * Line Chart Component
 * Dynamically loaded only when needed
 */

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface LineChartProps {
  data: any[];
  dataKeys: string[];
  xAxisKey: string;
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function LineChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  colors = DEFAULT_COLORS
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
