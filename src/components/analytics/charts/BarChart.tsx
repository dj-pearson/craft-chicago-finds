/**
 * Bar Chart Component
 * Dynamically loaded only when needed
 */

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface BarChartProps {
  data: any[];
  dataKeys: string[];
  xAxisKey: string;
  height?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function BarChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  colors = DEFAULT_COLORS
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
