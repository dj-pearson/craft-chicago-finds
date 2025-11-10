/**
 * Pricing Calculator Types and Logic
 * Comprehensive pricing calculator for handmade products
 */

export type CraftType =
  | 'jewelry'
  | 'woodwork'
  | 'textiles'
  | 'pottery'
  | 'candles'
  | 'soap'
  | 'art'
  | 'paper-goods'
  | 'home-decor'
  | 'accessories'
  | 'other';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type UniquenessLevel = 'mass-producible' | 'semi-unique' | 'one-of-a-kind';

export type TargetMarket = 'budget' | 'mid-range' | 'premium' | 'luxury';

export type SalesChannel = 'craftlocal' | 'etsy' | 'craft-fairs' | 'own-website' | 'wholesale';

export interface ProductDetails {
  craftType: CraftType;
  productName: string;
  experienceLevel: ExperienceLevel;
  uniqueness: UniquenessLevel;
}

export interface MaterialCosts {
  directMaterials: number;
  shippingCosts: number;
  packagingCosts: number;
  toolWear: number;
}

export interface TimeInvestment {
  productionHours: number;
  productionMinutes: number;
  designHours: number;
  designMinutes: number;
  qcHours: number;
  qcMinutes: number;
  listingHours: number;
  listingMinutes: number;
}

export interface BusinessContext {
  desiredHourlyRate: number;
  monthlyOverhead: number;
  monthlyVolume: number;
  salesChannel: SalesChannel;
}

export interface MarketPositioning {
  targetMarket: TargetMarket;
  competitiveness: number; // 1-10 scale
}

export interface CalculatorFormData {
  productDetails: ProductDetails;
  materialCosts: MaterialCosts;
  timeInvestment: TimeInvestment;
  businessContext: BusinessContext;
  marketPositioning: MarketPositioning;
}

export interface PricingBreakdown {
  trueCostToMake: number;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  minimumBreakeven: number;
  recommendedRetail: number;
  wholesalePrice: number;
  craftFairPrice: number;
  onlineMarketplacePrice: number;
}

export interface ProfitabilityAnalysis {
  profitMargin: number;
  effectiveHourlyRate: number;
  breakevenVolume: number;
  annualIncomePotential: number;
  monthsToProfit: number;
}

export interface MarketComparison {
  priceVsMarket: number; // percentage difference
  valuePerceptionScore: number;
  competitiveAdvantageScore: number;
  marketAveragePrice: number;
}

export interface Recommendation {
  type: 'pricing' | 'efficiency' | 'strategy';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
}

export interface CalculationResults {
  breakdown: PricingBreakdown;
  profitability: ProfitabilityAnalysis;
  marketComparison: MarketComparison;
  recommendations: Recommendation[];
}

// Market benchmark data by craft type
const MARKET_BENCHMARKS: Record<CraftType, { avgPrice: number; multiplier: number }> = {
  'jewelry': { avgPrice: 45, multiplier: 2.5 },
  'woodwork': { avgPrice: 85, multiplier: 2.8 },
  'textiles': { avgPrice: 55, multiplier: 2.3 },
  'pottery': { avgPrice: 65, multiplier: 2.6 },
  'candles': { avgPrice: 25, multiplier: 2.0 },
  'soap': { avgPrice: 12, multiplier: 2.2 },
  'art': { avgPrice: 150, multiplier: 3.0 },
  'paper-goods': { avgPrice: 18, multiplier: 2.4 },
  'home-decor': { avgPrice: 75, multiplier: 2.7 },
  'accessories': { avgPrice: 35, multiplier: 2.5 },
  'other': { avgPrice: 50, multiplier: 2.5 },
};

// Experience level hourly rate suggestions
const HOURLY_RATE_SUGGESTIONS: Record<ExperienceLevel, number> = {
  'beginner': 20,
  'intermediate': 30,
  'advanced': 45,
  'expert': 60,
};

// Uniqueness multipliers
const UNIQUENESS_MULTIPLIERS: Record<UniquenessLevel, number> = {
  'mass-producible': 1.0,
  'semi-unique': 1.3,
  'one-of-a-kind': 1.6,
};

// Target market multipliers
const TARGET_MARKET_MULTIPLIERS: Record<TargetMarket, number> = {
  'budget': 0.85,
  'mid-range': 1.0,
  'premium': 1.4,
  'luxury': 2.0,
};

// Sales channel commission rates
const CHANNEL_COMMISSION_RATES: Record<SalesChannel, number> = {
  'craftlocal': 0.15,
  'etsy': 0.20,
  'craft-fairs': 0.25, // booth fees, time, etc.
  'own-website': 0.05, // payment processing
  'wholesale': 0.50, // wholesale is 50% of retail
};

/**
 * Calculate total time in hours
 */
function calculateTotalHours(time: TimeInvestment): number {
  const production = time.productionHours + time.productionMinutes / 60;
  const design = time.designHours + time.designMinutes / 60;
  const qc = time.qcHours + time.qcMinutes / 60;
  const listing = time.listingHours + time.listingMinutes / 60;
  return production + design + qc + listing;
}

/**
 * Calculate total material costs
 */
function calculateTotalMaterialCosts(materials: MaterialCosts): number {
  return materials.directMaterials +
         materials.shippingCosts +
         materials.packagingCosts +
         materials.toolWear;
}

/**
 * Main pricing calculation engine
 */
export function calculatePricing(formData: CalculatorFormData): CalculationResults {
  const { productDetails, materialCosts, timeInvestment, businessContext, marketPositioning } = formData;

  // Calculate base costs
  const totalMaterialCost = calculateTotalMaterialCosts(materialCosts);
  const totalHours = calculateTotalHours(timeInvestment);
  const laborCost = totalHours * businessContext.desiredHourlyRate;

  // Calculate overhead per item
  const overheadPerItem = businessContext.monthlyVolume > 0
    ? businessContext.monthlyOverhead / businessContext.monthlyVolume
    : 0;

  // True cost to make
  const trueCostToMake = totalMaterialCost + laborCost + overheadPerItem;

  // Calculate recommended retail price with multipliers
  const benchmark = MARKET_BENCHMARKS[productDetails.craftType];
  const uniquenessMultiplier = UNIQUENESS_MULTIPLIERS[productDetails.uniqueness];
  const marketMultiplier = TARGET_MARKET_MULTIPLIERS[marketPositioning.targetMarket];

  // Base retail price (cost * 2.5 as minimum markup)
  let recommendedRetail = trueCostToMake * benchmark.multiplier;

  // Apply uniqueness and market positioning
  recommendedRetail *= uniquenessMultiplier * marketMultiplier;

  // Adjust for competitiveness (1-10 scale, where 10 is highly unique)
  const competitivenessAdjustment = 1 + ((marketPositioning.competitiveness - 5) * 0.05);
  recommendedRetail *= competitivenessAdjustment;

  // Calculate channel-specific pricing
  const channelRate = CHANNEL_COMMISSION_RATES[businessContext.salesChannel];
  const onlineMarketplacePrice = recommendedRetail / (1 - channelRate);
  const wholesalePrice = recommendedRetail * 0.5;
  const craftFairPrice = recommendedRetail * 1.1; // Usually slightly higher to cover costs

  // Profitability analysis
  const profit = recommendedRetail - trueCostToMake;
  const profitMargin = trueCostToMake > 0 ? (profit / recommendedRetail) * 100 : 0;
  const effectiveHourlyRate = totalHours > 0 ? profit / totalHours : 0;

  // Break-even calculations
  const breakevenVolume = businessContext.monthlyOverhead > 0
    ? Math.ceil(businessContext.monthlyOverhead / (recommendedRetail - totalMaterialCost - laborCost))
    : 0;

  const annualIncomePotential = (recommendedRetail - trueCostToMake) * businessContext.monthlyVolume * 12;
  const monthsToProfit = breakevenVolume > 0 && businessContext.monthlyVolume > 0
    ? breakevenVolume / businessContext.monthlyVolume
    : 0;

  // Market comparison
  const marketAvgPrice = benchmark.avgPrice;
  const priceVsMarket = marketAvgPrice > 0
    ? ((recommendedRetail - marketAvgPrice) / marketAvgPrice) * 100
    : 0;

  // Value perception (1-100 score based on price vs quality indicators)
  const qualityScore =
    (productDetails.experienceLevel === 'expert' ? 25 :
     productDetails.experienceLevel === 'advanced' ? 20 :
     productDetails.experienceLevel === 'intermediate' ? 15 : 10) +
    (productDetails.uniqueness === 'one-of-a-kind' ? 25 :
     productDetails.uniqueness === 'semi-unique' ? 15 : 5) +
    (marketPositioning.competitiveness * 5);

  const valuePerceptionScore = Math.min(100, qualityScore);

  const competitiveAdvantageScore = Math.min(100,
    (marketPositioning.competitiveness * 10) +
    (productDetails.uniqueness === 'one-of-a-kind' ? 30 :
     productDetails.uniqueness === 'semi-unique' ? 15 : 0)
  );

  // Generate recommendations
  const recommendations = generateRecommendations(formData, {
    breakdown: {
      trueCostToMake,
      materialCost: totalMaterialCost,
      laborCost,
      overheadCost: overheadPerItem,
      minimumBreakeven: trueCostToMake * 1.1, // 10% minimum markup
      recommendedRetail,
      wholesalePrice,
      craftFairPrice,
      onlineMarketplacePrice,
    },
    profitability: {
      profitMargin,
      effectiveHourlyRate,
      breakevenVolume,
      annualIncomePotential,
      monthsToProfit,
    },
    marketComparison: {
      priceVsMarket,
      valuePerceptionScore,
      competitiveAdvantageScore,
      marketAveragePrice: marketAvgPrice,
    },
    recommendations: [],
  });

  return {
    breakdown: {
      trueCostToMake,
      materialCost: totalMaterialCost,
      laborCost,
      overheadCost: overheadPerItem,
      minimumBreakeven: trueCostToMake * 1.1,
      recommendedRetail,
      wholesalePrice,
      craftFairPrice,
      onlineMarketplacePrice,
    },
    profitability: {
      profitMargin,
      effectiveHourlyRate,
      breakevenVolume,
      annualIncomePotential,
      monthsToProfit,
    },
    marketComparison: {
      priceVsMarket,
      valuePerceptionScore,
      competitiveAdvantageScore,
      marketAveragePrice: marketAvgPrice,
    },
    recommendations,
  };
}

/**
 * Generate personalized recommendations based on calculations
 */
function generateRecommendations(
  formData: CalculatorFormData,
  results: CalculationResults
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const { businessContext, productDetails, timeInvestment, materialCosts } = formData;
  const { breakdown, profitability } = results;

  // Check if hourly rate is too low
  const suggestedRate = HOURLY_RATE_SUGGESTIONS[productDetails.experienceLevel];
  if (businessContext.desiredHourlyRate < suggestedRate) {
    recommendations.push({
      type: 'pricing',
      priority: 'high',
      title: `Increase your hourly rate to match your ${productDetails.experienceLevel} skill level`,
      description: `Your current rate of $${businessContext.desiredHourlyRate}/hr is below the suggested $${suggestedRate}/hr for ${productDetails.experienceLevel} makers.`,
      impact: `+$${((suggestedRate - businessContext.desiredHourlyRate) * calculateTotalHours(timeInvestment)).toFixed(2)} per item`,
    });
  }

  // Check if they're below minimum wage
  if (profitability.effectiveHourlyRate < 15) {
    recommendations.push({
      type: 'pricing',
      priority: 'high',
      title: 'Your effective hourly rate is below minimum wage',
      description: `You're earning $${profitability.effectiveHourlyRate.toFixed(2)}/hr after expenses. Increase prices or reduce production time.`,
      impact: 'Critical - unsustainable pricing',
    });
  }

  // Check profit margin
  if (profitability.profitMargin < 40) {
    recommendations.push({
      type: 'pricing',
      priority: 'high',
      title: 'Increase your profit margin for sustainability',
      description: `Your ${profitability.profitMargin.toFixed(1)}% margin is too low. Aim for 50-60% for handmade products.`,
      impact: `Increase price by $${((breakdown.recommendedRetail * 0.2)).toFixed(2)} to reach 50% margin`,
    });
  }

  // Check if materials are suspiciously low
  const totalHours = calculateTotalHours(timeInvestment);
  if (totalHours > 2 && materialCosts.directMaterials < 5) {
    recommendations.push({
      type: 'pricing',
      priority: 'medium',
      title: 'Review your material costs',
      description: 'Your material costs seem low. Make sure you\'re accounting for all supplies, shipping, and packaging.',
      impact: 'Accurate costing is essential for profitability',
    });
  }

  // Batching recommendation
  if (totalHours > 3) {
    recommendations.push({
      type: 'efficiency',
      priority: 'medium',
      title: 'Batch your production to save time',
      description: 'Making multiple items at once can reduce per-item time by 20-40%.',
      impact: `Save ~${(totalHours * 0.3).toFixed(1)} hours per item`,
    });
  }

  // Bulk materials recommendation
  if (materialCosts.directMaterials > 20 && businessContext.monthlyVolume > 10) {
    recommendations.push({
      type: 'efficiency',
      priority: 'medium',
      title: 'Buy materials in bulk to reduce costs',
      description: 'With your production volume, bulk purchasing could save 15-25% on materials.',
      impact: `-$${(materialCosts.directMaterials * 0.2).toFixed(2)} per item`,
    });
  }

  // Product line strategy
  if (breakdown.recommendedRetail > 40) {
    recommendations.push({
      type: 'strategy',
      priority: 'low',
      title: 'Create a tiered product line',
      description: 'Offer a premium version at a higher price point and a simpler version for budget shoppers.',
      impact: 'Increase average order value by 30%',
    });
  }

  // Bundle recommendation
  if (breakdown.recommendedRetail < 50) {
    recommendations.push({
      type: 'strategy',
      priority: 'medium',
      title: 'Bundle products to increase order value',
      description: 'Create sets of 3 items at a slight discount to boost average order value.',
      impact: `Increase from $${breakdown.recommendedRetail.toFixed(2)} to $${(breakdown.recommendedRetail * 2.5).toFixed(2)} per sale`,
    });
  }

  // CraftLocal advantage
  if (businessContext.salesChannel !== 'craftlocal') {
    const craftlocalPrice = breakdown.recommendedRetail / (1 - CHANNEL_COMMISSION_RATES.craftlocal);
    const currentPrice = breakdown.onlineMarketplacePrice;
    if (craftlocalPrice < currentPrice) {
      recommendations.push({
        type: 'strategy',
        priority: 'high',
        title: 'Sell on CraftLocal to keep more profit',
        description: `CraftLocal's ${(CHANNEL_COMMISSION_RATES.craftlocal * 100).toFixed(0)}% commission is lower than most platforms.`,
        impact: `Save $${(currentPrice - craftlocalPrice).toFixed(2)} per sale`,
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Get suggested hourly rate by experience level
 */
export function getSuggestedHourlyRate(level: ExperienceLevel): number {
  return HOURLY_RATE_SUGGESTIONS[level];
}

/**
 * Get craft type display name
 */
export function getCraftTypeLabel(type: CraftType): string {
  const labels: Record<CraftType, string> = {
    'jewelry': 'Jewelry',
    'woodwork': 'Woodwork',
    'textiles': 'Textiles',
    'pottery': 'Pottery',
    'candles': 'Candles',
    'soap': 'Soap & Bath Products',
    'art': 'Art & Prints',
    'paper-goods': 'Paper Goods',
    'home-decor': 'Home Decor',
    'accessories': 'Accessories',
    'other': 'Other',
  };
  return labels[type];
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}
