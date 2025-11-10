import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { HelpCircle, ArrowRight, ArrowLeft, Calculator } from 'lucide-react';
import {
  CalculatorFormData,
  CraftType,
  ExperienceLevel,
  UniquenessLevel,
  TargetMarket,
  SalesChannel,
  getCraftTypeLabel,
  getSuggestedHourlyRate,
} from '@/lib/pricing-calculator';

interface PricingCalculatorFormProps {
  onComplete: (data: CalculatorFormData) => void;
}

const CRAFT_TYPES: CraftType[] = [
  'jewelry',
  'woodwork',
  'textiles',
  'pottery',
  'candles',
  'soap',
  'art',
  'paper-goods',
  'home-decor',
  'accessories',
  'other',
];

export function PricingCalculatorForm({ onComplete }: PricingCalculatorFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<CalculatorFormData>({
    productDetails: {
      craftType: 'jewelry',
      productName: '',
      experienceLevel: 'intermediate',
      uniqueness: 'semi-unique',
    },
    materialCosts: {
      directMaterials: 0,
      shippingCosts: 0,
      packagingCosts: 0,
      toolWear: 0,
    },
    timeInvestment: {
      productionHours: 0,
      productionMinutes: 0,
      designHours: 0,
      designMinutes: 0,
      qcHours: 0,
      qcMinutes: 0,
      listingHours: 0,
      listingMinutes: 0,
    },
    businessContext: {
      desiredHourlyRate: 30,
      monthlyOverhead: 0,
      monthlyVolume: 20,
      salesChannel: 'craftlocal',
    },
    marketPositioning: {
      targetMarket: 'mid-range',
      competitiveness: 5,
    },
  });

  const sections = [
    { title: 'Product Details', description: 'Tell us about your craft' },
    { title: 'Material Costs', description: 'What does it cost to make?' },
    { title: 'Time Investment', description: 'How long does it take?' },
    { title: 'Business Context', description: 'Your business model' },
    { title: 'Market Positioning', description: 'Who are your customers?' },
  ];

  const progress = ((currentSection + 1) / sections.length) * 100;

  const updateFormData = (section: keyof CalculatorFormData, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      onComplete(formData);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const isCurrentSectionValid = () => {
    switch (currentSection) {
      case 0:
        return formData.productDetails.productName.trim() !== '';
      case 1:
        return formData.materialCosts.directMaterials > 0;
      case 2:
        return (
          formData.timeInvestment.productionHours > 0 ||
          formData.timeInvestment.productionMinutes > 0
        );
      case 3:
        return formData.businessContext.desiredHourlyRate > 0;
      case 4:
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            Step {currentSection + 1} of {sections.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {sections[currentSection].title}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <motion.div
        key={currentSection}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{sections[currentSection].title}</CardTitle>
            <CardDescription className="text-base">
              {sections[currentSection].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentSection === 0 && <ProductDetailsSection formData={formData} updateFormData={updateFormData} />}
            {currentSection === 1 && <MaterialCostsSection formData={formData} updateFormData={updateFormData} />}
            {currentSection === 2 && <TimeInvestmentSection formData={formData} updateFormData={updateFormData} />}
            {currentSection === 3 && <BusinessContextSection formData={formData} updateFormData={updateFormData} />}
            {currentSection === 4 && <MarketPositioningSection formData={formData} updateFormData={updateFormData} />}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isCurrentSectionValid()}
                className="bg-green-600 hover:bg-green-700"
              >
                {currentSection === sections.length - 1 ? (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate My Pricing
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ============ SECTION 1: PRODUCT DETAILS ============
function ProductDetailsSection({
  formData,
  updateFormData,
}: {
  formData: CalculatorFormData;
  updateFormData: any;
}) {
  return (
    <div className="space-y-6">
      {/* Product Type */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Product Type"
          tooltip="Choose the category that best describes your craft. This helps us provide accurate market benchmarks."
        />
        <Select
          value={formData.productDetails.craftType}
          onValueChange={(value) => updateFormData('productDetails', 'craftType', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CRAFT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {getCraftTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Name */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Product Name"
          tooltip="Give your product a name. This personalizes your results and helps you track different products."
        />
        <Input
          placeholder="e.g., Hand-Knit Wool Scarf"
          value={formData.productDetails.productName}
          onChange={(e) => updateFormData('productDetails', 'productName', e.target.value)}
        />
      </div>

      {/* Experience Level */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Your Experience Level"
          tooltip="Your skill level affects suggested pricing. Advanced makers can command higher prices for their expertise."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['beginner', 'intermediate', 'advanced', 'expert'] as ExperienceLevel[]).map((level) => (
            <Button
              key={level}
              variant={formData.productDetails.experienceLevel === level ? 'default' : 'outline'}
              onClick={() => updateFormData('productDetails', 'experienceLevel', level)}
              className="capitalize"
            >
              {level}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Suggested hourly rate: ${getSuggestedHourlyRate(formData.productDetails.experienceLevel)}/hr
        </p>
      </div>

      {/* Uniqueness */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Item Uniqueness"
          tooltip="One-of-a-kind items can command premium pricing. Reproducible items typically have lower margins but higher volume potential."
        />
        <div className="grid grid-cols-3 gap-2">
          {(['mass-producible', 'semi-unique', 'one-of-a-kind'] as UniquenessLevel[]).map((level) => (
            <Button
              key={level}
              variant={formData.productDetails.uniqueness === level ? 'default' : 'outline'}
              onClick={() => updateFormData('productDetails', 'uniqueness', level)}
              className="capitalize text-xs md:text-sm whitespace-normal h-auto py-3"
            >
              {level.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ SECTION 2: MATERIAL COSTS ============
function MaterialCostsSection({
  formData,
  updateFormData,
}: {
  formData: CalculatorFormData;
  updateFormData: any;
}) {
  const totalMaterials =
    formData.materialCosts.directMaterials +
    formData.materialCosts.shippingCosts +
    formData.materialCosts.packagingCosts +
    formData.materialCosts.toolWear;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Pro Tip:</strong> Include ALL costs to make one item. Many makers forget shipping, packaging, and tool wear - leading to underpricing!
        </p>
      </div>

      {/* Direct Materials */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Direct Material Costs per Item"
          tooltip="All raw materials that go into making one item. Example for jewelry: beads, wire, clasps, findings."
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="pl-7"
            value={formData.materialCosts.directMaterials || ''}
            onChange={(e) => updateFormData('materialCosts', 'directMaterials', parseFloat(e.target.value) || 0)}
          />
        </div>
        <p className="text-xs text-muted-foreground">Examples: fabric, wood, clay, wax, metals, stones</p>
      </div>

      {/* Shipping Costs */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Material Shipping Costs (often forgotten!)"
          tooltip="Shipping you paid to get materials delivered. Often overlooked but adds to your true cost."
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="pl-7"
            value={formData.materialCosts.shippingCosts || ''}
            onChange={(e) => updateFormData('materialCosts', 'shippingCosts', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Packaging */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Packaging Costs"
          tooltip="Boxes, tissue paper, tags, ribbons, bags, bubble wrap - everything that presents your product beautifully."
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="pl-7"
            value={formData.materialCosts.packagingCosts || ''}
            onChange={(e) => updateFormData('materialCosts', 'packagingCosts', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Tool Wear */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Tool Wear / Equipment Cost (optional)"
          tooltip="Tools and equipment wear out. Estimate replacement cost divided by items you'll make with them."
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="pl-7"
            value={formData.materialCosts.toolWear || ''}
            onChange={(e) => updateFormData('materialCosts', 'toolWear', parseFloat(e.target.value) || 0)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Example: $300 sewing machine ÷ 1000 items = $0.30 per item
        </p>
      </div>

      {/* Total Display */}
      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Material Cost per Item:</span>
          <span className="text-2xl font-bold text-green-600">${totalMaterials.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ============ SECTION 3: TIME INVESTMENT ============
function TimeInvestmentSection({
  formData,
  updateFormData,
}: {
  formData: CalculatorFormData;
  updateFormData: any;
}) {
  const totalHours =
    formData.timeInvestment.productionHours +
    formData.timeInvestment.productionMinutes / 60 +
    formData.timeInvestment.designHours +
    formData.timeInvestment.designMinutes / 60 +
    formData.timeInvestment.qcHours +
    formData.timeInvestment.qcMinutes / 60 +
    formData.timeInvestment.listingHours +
    formData.timeInvestment.listingMinutes / 60;

  const TimeInputPair = ({ label, tooltip, hoursKey, minutesKey }: any) => (
    <div className="space-y-2">
      <LabelWithTooltip label={label} tooltip={tooltip} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={formData.timeInvestment[hoursKey] || ''}
            onChange={(e) => updateFormData('timeInvestment', hoursKey, parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground mt-1">hours</p>
        </div>
        <div>
          <Input
            type="number"
            min="0"
            max="59"
            placeholder="0"
            value={formData.timeInvestment[minutesKey] || ''}
            onChange={(e) => updateFormData('timeInvestment', minutesKey, parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground mt-1">minutes</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 rounded-lg p-4">
        <p className="text-sm text-orange-900">
          <strong>Be Honest!</strong> Track your time for 3-5 items to get an accurate average. Most makers underestimate their time by 30-50%.
        </p>
      </div>

      <TimeInputPair
        label="Production Time"
        tooltip="Actual hands-on time making the item from start to finish. Be realistic!"
        hoursKey="productionHours"
        minutesKey="productionMinutes"
      />

      <TimeInputPair
        label="Design / Setup Time"
        tooltip="Time spent designing, planning, or setting up equipment. For custom work, include consultation time."
        hoursKey="designHours"
        minutesKey="designMinutes"
      />

      <TimeInputPair
        label="Quality Control / Finishing"
        tooltip="Final inspection, touch-ups, polishing, cleaning - the details that make it perfect."
        hoursKey="qcHours"
        minutesKey="qcMinutes"
      />

      <TimeInputPair
        label="Photography / Listing Time"
        tooltip="Time to photograph, edit photos, write descriptions, and list online. Divide total listing time by items photographed together."
        hoursKey="listingHours"
        minutesKey="listingMinutes"
      />

      {/* Total Display */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Time per Item:</span>
          <span className="text-2xl font-bold text-blue-600">
            {totalHours.toFixed(1)} hours
          </span>
        </div>
        {totalHours > 5 && (
          <p className="text-sm text-blue-700 mt-2">
            💡 Consider batch production to reduce per-item time by 20-40%
          </p>
        )}
      </div>
    </div>
  );
}

// ============ SECTION 4: BUSINESS CONTEXT ============
function BusinessContextSection({
  formData,
  updateFormData,
}: {
  formData: CalculatorFormData;
  updateFormData: any;
}) {
  return (
    <div className="space-y-6">
      {/* Desired Hourly Rate */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Desired Hourly Rate"
          tooltip="What do you want to earn per hour? Consider your skill level, local wages, and business goals."
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            step="1"
            min="0"
            placeholder="30"
            className="pl-7"
            value={formData.businessContext.desiredHourlyRate || ''}
            onChange={(e) => updateFormData('businessContext', 'desiredHourlyRate', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Beginner: $20/hr | Intermediate: $30/hr | Advanced: $45/hr | Expert: $60+/hr</p>
        </div>
      </div>

      {/* Monthly Overhead */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Monthly Business Overhead (optional)"
          tooltip="Studio rent, utilities, website fees, insurance, business licenses. Leave blank if you don't have overhead."
        />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            step="10"
            min="0"
            placeholder="0"
            className="pl-7"
            value={formData.businessContext.monthlyOverhead || ''}
            onChange={(e) => updateFormData('businessContext', 'monthlyOverhead', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Monthly Volume */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Expected Monthly Production Volume"
          tooltip="How many of this item do you plan to make and sell each month? This helps calculate overhead allocation."
        />
        <Input
          type="number"
          min="1"
          placeholder="20"
          value={formData.businessContext.monthlyVolume || ''}
          onChange={(e) => updateFormData('businessContext', 'monthlyVolume', parseInt(e.target.value) || 0)}
        />
        <p className="text-xs text-muted-foreground">units per month</p>
      </div>

      {/* Sales Channel */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Primary Sales Channel"
          tooltip="Where will you sell most? Different channels have different commission rates that affect your pricing."
        />
        <Select
          value={formData.businessContext.salesChannel}
          onValueChange={(value) => updateFormData('businessContext', 'salesChannel', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="craftlocal">
              CraftLocal (15% commission)
              <Badge variant="secondary" className="ml-2">Recommended</Badge>
            </SelectItem>
            <SelectItem value="etsy">Etsy (20% total fees)</SelectItem>
            <SelectItem value="craft-fairs">Craft Fairs & Shows</SelectItem>
            <SelectItem value="own-website">Own Website</SelectItem>
            <SelectItem value="wholesale">Wholesale to Shops</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ============ SECTION 5: MARKET POSITIONING ============
function MarketPositioningSection({
  formData,
  updateFormData,
}: {
  formData: CalculatorFormData;
  updateFormData: any;
}) {
  return (
    <div className="space-y-6">
      {/* Target Market */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="Target Market"
          tooltip="Who are you selling to? Premium buyers pay more for quality. Budget buyers prioritize price."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['budget', 'mid-range', 'premium', 'luxury'] as TargetMarket[]).map((market) => (
            <Button
              key={market}
              variant={formData.marketPositioning.targetMarket === market ? 'default' : 'outline'}
              onClick={() => updateFormData('marketPositioning', 'targetMarket', market)}
              className="capitalize"
            >
              {market.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Competitive Landscape */}
      <div className="space-y-2">
        <LabelWithTooltip
          label="How Unique is Your Offering?"
          tooltip="Rate from 1 (very common) to 10 (completely unique). Unique products can command higher prices."
        />
        <div className="px-4">
          <Slider
            value={[formData.marketPositioning.competitiveness]}
            onValueChange={(value) => updateFormData('marketPositioning', 'competitiveness', value[0])}
            min={1}
            max={10}
            step={1}
            className="my-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Very Competitive</span>
            <span className="text-lg font-bold text-foreground">{formData.marketPositioning.competitiveness}</span>
            <span>Unique Offering</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Ready to see your pricing?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We'll calculate your recommended retail price, show you channel-specific pricing,
          analyze your profitability, and give you personalized recommendations to maximize your income.
        </p>
        <div className="flex items-center gap-2 text-sm">
          <Calculator className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-600">
            Click "Calculate My Pricing" below to see your results!
          </span>
        </div>
      </div>
    </div>
  );
}

// ============ HELPER COMPONENT ============
function LabelWithTooltip({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <Label>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
