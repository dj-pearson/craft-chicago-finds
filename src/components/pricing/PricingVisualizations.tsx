import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import { CalculationResults, formatCurrency } from '@/lib/pricing-calculator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface PricingVisualizationsProps {
  results: CalculationResults;
  productName: string;
}

const COLORS = {
  material: '#f97316',
  labor: '#3b82f6',
  overhead: '#8b5cf6',
  profit: '#10b981',
  breakeven: '#ef4444',
  recommended: '#10b981',
  market: '#6b7280',
};

export function PricingVisualizations({ results, productName }: PricingVisualizationsProps) {
  return (
    <div className="space-y-6">
      <CostBreakdownChart results={results} />
      <PricingTiersChart results={results} productName={productName} />
      <HourlyRateGauge results={results} />
      <AnnualIncomeProjection results={results} />
      <BreakEvenChart results={results} />
    </div>
  );
}

/**
 * Cost Breakdown Waterfall Chart
 */
function CostBreakdownChart({ results }: { results: CalculationResults }) {
  const { breakdown } = results;

  const data = [
    {
      name: 'Materials',
      value: breakdown.materialCost,
      fill: COLORS.material,
    },
    {
      name: 'Labor',
      value: breakdown.laborCost,
      fill: COLORS.labor,
    },
    {
      name: 'Overhead',
      value: breakdown.overheadCost,
      fill: COLORS.overhead,
    },
    {
      name: 'Profit',
      value: breakdown.recommendedRetail - breakdown.trueCostToMake,
      fill: COLORS.profit,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>
            How your price is calculated - from materials to profit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Cost to Make</p>
              <p className="text-2xl font-bold">{formatCurrency(breakdown.trueCostToMake)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Recommended Price</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(breakdown.recommendedRetail)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Pricing Tiers Comparison Chart
 */
function PricingTiersChart({ results, productName }: { results: CalculationResults; productName: string }) {
  const { breakdown, marketComparison } = results;

  const data = [
    {
      name: 'Your Price',
      value: breakdown.recommendedRetail,
      type: 'recommended',
    },
    {
      name: 'Market Avg',
      value: marketComparison.marketAveragePrice,
      type: 'market',
    },
    {
      name: 'Break-Even',
      value: breakdown.minimumBreakeven,
      type: 'breakeven',
    },
    {
      name: 'Wholesale',
      value: breakdown.wholesalePrice,
      type: 'wholesale',
    },
    {
      name: 'Online',
      value: breakdown.onlineMarketplacePrice,
      type: 'online',
    },
    {
      name: 'Craft Fair',
      value: breakdown.craftFairPrice,
      type: 'craftfair',
    },
  ].sort((a, b) => a.value - b.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Pricing Comparison</CardTitle>
          <CardDescription>
            How your {productName || 'product'} price compares across different channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value.toFixed(0)}`} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.type === 'recommended' ? COLORS.recommended :
                      entry.type === 'market' ? COLORS.market :
                      entry.type === 'breakeven' ? COLORS.breakeven :
                      COLORS.overhead
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">💡 Insight:</span> Your price is{' '}
              <span className="font-bold">
                {marketComparison.priceVsMarket > 0 ? '+' : ''}
                {marketComparison.priceVsMarket.toFixed(1)}%
              </span>{' '}
              {marketComparison.priceVsMarket > 0 ? 'above' : 'below'} market average.
              {marketComparison.priceVsMarket < -20 && ' Consider increasing your prices!'}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Hourly Rate Reality Check Gauge
 */
function HourlyRateGauge({ results }: { results: CalculationResults }) {
  const { profitability } = results;
  const rate = profitability.effectiveHourlyRate;

  // Gauge data
  const maxRate = 100;
  const percentage = Math.min((rate / maxRate) * 100, 100);

  const gaugeData = [
    {
      name: 'Rate',
      value: rate,
      fill: rate < 15 ? '#ef4444' : rate < 25 ? '#f59e0b' : rate < 40 ? '#3b82f6' : '#10b981',
    },
  ];

  const getRateStatus = () => {
    if (rate < 15) return { text: 'Below Minimum Wage', color: 'text-red-600' };
    if (rate < 25) return { text: 'Getting There', color: 'text-orange-500' };
    if (rate < 40) return { text: 'Good', color: 'text-blue-600' };
    return { text: 'Excellent', color: 'text-green-600' };
  };

  const status = getRateStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Effective Hourly Rate</CardTitle>
          <CardDescription>
            What you're actually earning per hour after all expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={gaugeData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  minAngle={15}
                  background
                  clockWise
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center -mt-8">
              <p className="text-4xl font-bold">{formatCurrency(rate)}/hr</p>
              <p className={`text-lg font-semibold ${status.color} mt-2`}>
                {status.text}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <p className="text-muted-foreground">Minimum</p>
              <p className="font-semibold text-red-600">$15/hr</p>
            </div>
            <div>
              <p className="text-muted-foreground">Target</p>
              <p className="font-semibold text-blue-600">$30/hr</p>
            </div>
            <div>
              <p className="text-muted-foreground">Professional</p>
              <p className="font-semibold text-green-600">$45+/hr</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Annual Income Projection Chart
 */
function AnnualIncomeProjection({ results }: { results: CalculationResults }) {
  const { profitability, breakdown } = results;

  // Calculate projections for different monthly volumes
  const volumes = [10, 20, 30, 40, 50, 75, 100];
  const data = volumes.map(volume => {
    const monthlyRevenue = breakdown.recommendedRetail * volume;
    const monthlyCosts = breakdown.trueCostToMake * volume;
    const monthlyProfit = monthlyRevenue - monthlyCosts;
    const annualProfit = monthlyProfit * 12;

    return {
      volume,
      revenue: monthlyRevenue,
      costs: monthlyCosts,
      profit: monthlyProfit,
      annual: annualProfit,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Income Projection</CardTitle>
          <CardDescription>
            Potential annual profit at different production volumes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="volume"
                label={{ value: 'Monthly Units Sold', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                label={{ value: 'Annual Profit', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `${label} units/month`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="annual"
                stroke={COLORS.profit}
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Annual Profit"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">💰 Your Potential:</span> At your current pricing,
              selling 50 items per month could generate{' '}
              <span className="font-bold text-green-600">
                {formatCurrency((breakdown.recommendedRetail - breakdown.trueCostToMake) * 50 * 12)}
              </span>{' '}
              in annual profit.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Break-Even Analysis Chart
 */
function BreakEvenChart({ results }: { results: CalculationResults }) {
  const { profitability, breakdown } = results;

  // Calculate cumulative profit over months
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const profitPerUnit = breakdown.recommendedRetail - breakdown.trueCostToMake;

  const data = months.map(month => {
    const unitsSold = profitability.breakevenVolume > 0
      ? Math.floor((month / profitability.monthsToProfit) * profitability.breakevenVolume)
      : month * 20; // Default assumption

    const revenue = unitsSold * breakdown.recommendedRetail;
    const costs = unitsSold * breakdown.trueCostToMake;
    const profit = revenue - costs;

    return {
      month: `Month ${month}`,
      units: unitsSold,
      revenue,
      costs,
      profit,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Break-Even Timeline</CardTitle>
          <CardDescription>
            Path to profitability over the next 12 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.profit}
                strokeWidth={2}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="costs"
                stroke={COLORS.breakeven}
                strokeWidth={2}
                name="Costs"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Break-Even Volume</p>
              <p className="text-xl font-bold">
                {profitability.breakevenVolume > 0
                  ? `${profitability.breakevenVolume} units/month`
                  : 'Already profitable'
                }
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Time to Profit</p>
              <p className="text-xl font-bold">
                {profitability.monthsToProfit > 0
                  ? `${profitability.monthsToProfit.toFixed(1)} months`
                  : 'Immediate'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
