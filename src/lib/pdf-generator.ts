import jsPDF from 'jspdf';
import { CalculationResults, CalculatorFormData, getCraftTypeLabel, formatCurrency, formatPercentage } from './pricing-calculator';

/**
 * Generate comprehensive pricing strategy PDF guide
 */
export async function generatePricingPDF(
  formData: CalculatorFormData,
  results: CalculationResults
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Helper to add section
  const addSection = (title: string) => {
    checkPageBreak(30);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 20, yPos);
    yPos += 10;
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
  };

  // ========== COVER PAGE ==========
  doc.setFillColor(16, 185, 129); // Green background
  doc.rect(0, 0, pageWidth, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Pricing Strategy Guide', pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Price with Confidence & Build a Profitable Craft Business', pageWidth / 2, 45, { align: 'center' });

  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPos = 80;

  // Product Information
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.productDetails.productName || 'Your Product', 20, yPos);
  yPos += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Craft Type: ${getCraftTypeLabel(formData.productDetails.craftType)}`, 20, yPos);
  yPos += 6;
  doc.text(`Experience Level: ${formData.productDetails.experienceLevel}`, 20, yPos);
  yPos += 6;
  doc.text(`Uniqueness: ${formData.productDetails.uniqueness}`, 20, yPos);
  yPos += 15;

  // Key Pricing Summary Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(20, yPos, pageWidth - 40, 50, 3, 3, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Your Recommended Pricing', 30, yPos + 10);

  doc.setFontSize(24);
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(results.breakdown.recommendedRetail), 30, yPos + 25);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`True Cost: ${formatCurrency(results.breakdown.trueCostToMake)}`, 30, yPos + 35);
  doc.text(`Profit Margin: ${formatPercentage(results.profitability.profitMargin)}`, 30, yPos + 42);

  yPos += 60;

  // Date and branding
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, yPos);
  doc.text('CraftLocal.net - Where Makers Thrive', pageWidth - 20, yPos, { align: 'right' });

  // ========== PAGE 2: COST BREAKDOWN ==========
  doc.addPage();
  yPos = 20;

  addSection('Cost Breakdown');

  // Create table for costs
  doc.setFontSize(11);
  const tableData = [
    ['Materials', formatCurrency(results.breakdown.materialCost)],
    ['Labor', formatCurrency(results.breakdown.laborCost)],
    ['Overhead (per item)', formatCurrency(results.breakdown.overheadCost)],
    ['Total Cost to Make', formatCurrency(results.breakdown.trueCostToMake)],
    ['', ''],
    ['Recommended Retail Price', formatCurrency(results.breakdown.recommendedRetail)],
    ['Profit per Item', formatCurrency(results.breakdown.recommendedRetail - results.breakdown.trueCostToMake)],
  ];

  tableData.forEach((row, index) => {
    doc.setFont('helvetica', index === 3 || index === 5 ? 'bold' : 'normal');
    if (index === 4) {
      yPos += 3; // Extra space before retail pricing
    }
    doc.text(row[0], 25, yPos);
    doc.text(row[1], pageWidth - 25, yPos, { align: 'right' });
    yPos += 8;
  });

  yPos += 10;

  // Cost insights
  doc.setFillColor(254, 243, 199); // Light yellow
  doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('💡 Cost Insights', 25, yPos + 8);

  doc.setFont('helvetica', 'normal');
  const materialPercent = (results.breakdown.materialCost / results.breakdown.trueCostToMake) * 100;
  const laborPercent = (results.breakdown.laborCost / results.breakdown.trueCostToMake) * 100;

  doc.text(`• Materials account for ${materialPercent.toFixed(0)}% of your total cost`, 25, yPos + 16);
  doc.text(`• Labor accounts for ${laborPercent.toFixed(0)}% of your total cost`, 25, yPos + 23);
  doc.text(`• Your markup is ${((results.breakdown.recommendedRetail / results.breakdown.trueCostToMake - 1) * 100).toFixed(0)}% above cost`, 25, yPos + 30);

  yPos += 45;

  // ========== CHANNEL-SPECIFIC PRICING ==========
  addSection('Pricing by Sales Channel');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Adjust your pricing based on where you sell to account for fees and costs:', 20, yPos);
  yPos += 10;

  const channelPricing = [
    { channel: 'CraftLocal Marketplace', price: results.breakdown.onlineMarketplacePrice, note: 'Lower fees = more profit for you' },
    { channel: 'Craft Fairs & Shows', price: results.breakdown.craftFairPrice, note: 'Covers booth fees and time' },
    { channel: 'Wholesale to Shops', price: results.breakdown.wholesalePrice, note: 'Typically 50% of retail' },
    { channel: 'Direct/Own Website', price: results.breakdown.recommendedRetail, note: 'Your base retail price' },
  ];

  channelPricing.forEach(item => {
    checkPageBreak(25);

    doc.setFillColor(243, 244, 246);
    doc.roundedRect(20, yPos, pageWidth - 40, 20, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text(item.channel, 25, yPos + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(item.note, 25, yPos + 14);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(formatCurrency(item.price), pageWidth - 25, yPos + 12, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    yPos += 25;
  });

  // ========== PAGE 3: PROFITABILITY ANALYSIS ==========
  doc.addPage();
  yPos = 20;

  addSection('Profitability Analysis');

  doc.setFontSize(11);

  const profitMetrics = [
    {
      label: 'Profit Margin',
      value: formatPercentage(results.profitability.profitMargin),
      insight: results.profitability.profitMargin < 40 ? 'Aim for 50-60% for sustainability' : 'Healthy margin!',
    },
    {
      label: 'Effective Hourly Rate',
      value: formatCurrency(results.profitability.effectiveHourlyRate) + '/hr',
      insight: results.profitability.effectiveHourlyRate < 20 ? 'Consider increasing prices' : 'Good hourly rate!',
    },
    {
      label: 'Annual Income Potential',
      value: formatCurrency(results.profitability.annualIncomePotential),
      insight: 'Based on your current monthly volume',
    },
    {
      label: 'Break-Even Volume',
      value: `${results.profitability.breakevenVolume} units/month`,
      insight: 'Units needed to cover overhead',
    },
  ];

  profitMetrics.forEach((metric, index) => {
    checkPageBreak(30);

    doc.setFont('helvetica', 'bold');
    doc.text(metric.label, 25, yPos);

    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text(metric.value, 25, yPos + 9);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(metric.insight, 25, yPos + 16);

    doc.setFontSize(11);
    yPos += 25;
  });

  // ========== RECOMMENDATIONS ==========
  checkPageBreak(40);
  addSection('Your Personalized Recommendations');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  results.recommendations.slice(0, 6).forEach((rec, index) => {
    checkPageBreak(35);

    // Priority badge
    const priorityColors = {
      high: [239, 68, 68],
      medium: [245, 158, 11],
      low: [59, 130, 246],
    };

    const color = priorityColors[rec.priority];
    doc.setFillColor(...color);
    doc.roundedRect(20, yPos, 15, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(rec.priority.toUpperCase(), 27.5, yPos + 4, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${rec.title}`, 38, yPos + 4);

    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(rec.description, pageWidth - 50);
    doc.text(descLines, 25, yPos);
    yPos += descLines.length * 5;

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(16, 185, 129);
    doc.text(`Impact: ${rec.impact}`, 25, yPos);
    doc.setTextColor(0, 0, 0);

    yPos += 12;
  });

  // ========== MARKET COMPARISON ==========
  checkPageBreak(50);
  addSection('Market Positioning');

  doc.setFontSize(10);

  const marketInsights = [
    `Your price is ${results.marketComparison.priceVsMarket > 0 ? 'above' : 'below'} market average by ${Math.abs(results.marketComparison.priceVsMarket).toFixed(1)}%`,
    `Market average: ${formatCurrency(results.marketComparison.marketAveragePrice)}`,
    `Value perception score: ${results.marketComparison.valuePerceptionScore.toFixed(0)}/100`,
    `Competitive advantage: ${results.marketComparison.competitiveAdvantageScore.toFixed(0)}/100`,
  ];

  marketInsights.forEach(insight => {
    doc.text(`• ${insight}`, 25, yPos);
    yPos += 7;
  });

  // ========== FINAL PAGE: NEXT STEPS ==========
  doc.addPage();
  yPos = 20;

  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Next Steps', pageWidth / 2, 30, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  yPos = 70;

  addSection('Turn Your Pricing Into Sales');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const nextSteps = [
    'Review your pricing calculations and adjust your products accordingly',
    'Update your listings with confidence in your new prices',
    'Communicate your value - tell your story to justify your pricing',
    'Track your sales and profit margins monthly',
    'Join CraftLocal marketplace for lower fees and better support',
    'Batch your production to improve efficiency',
    'Consider creating premium and standard product lines',
  ];

  nextSteps.forEach((step, index) => {
    checkPageBreak(15);

    doc.setFillColor(16, 185, 129);
    doc.circle(25, yPos - 2, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text((index + 1).toString(), 25, yPos + 1, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(step, pageWidth - 60);
    doc.text(lines, 35, yPos);

    yPos += lines.length * 7 + 5;
  });

  yPos += 10;

  // CTA Box
  checkPageBreak(50);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(20, yPos, pageWidth - 40, 45, 3, 3, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text('Ready to Sell Your Crafts?', pageWidth / 2, yPos + 12, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Join CraftLocal marketplace where makers are valued:', pageWidth / 2, yPos + 22, { align: 'center' });

  doc.setFontSize(9);
  doc.text('✓ Lower commission rates than other platforms', pageWidth / 2, yPos + 29, { align: 'center' });
  doc.text('✓ Free listing and setup assistance', pageWidth / 2, yPos + 35, { align: 'center' });
  doc.text('✓ Direct customer relationships', pageWidth / 2, yPos + 41, { align: 'center' });

  // Footer
  yPos = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('CraftLocal.net - Empowering Local Makers Since 2025', pageWidth / 2, yPos, { align: 'center' });
  doc.text('Visit craftlocal.net to list your products', pageWidth / 2, yPos + 5, { align: 'center' });

  return doc.output('blob');
}

/**
 * Trigger PDF download
 */
export function downloadPricingPDF(blob: Blob, productName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${productName || 'pricing'}-strategy-guide.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
