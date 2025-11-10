import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { PricingCalculatorForm } from '@/components/pricing/PricingCalculatorForm';
import { PricingVisualizations } from '@/components/pricing/PricingVisualizations';
import { EmailCaptureModal } from '@/components/pricing/EmailCaptureModal';
import {
  CalculatorFormData,
  CalculationResults,
  calculatePricing,
  formatCurrency,
  formatPercentage,
} from '@/lib/pricing-calculator';
import { generatePricingPDF, downloadPricingPDF } from '@/lib/pdf-generator';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Download,
  Share2,
  RotateCcw,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function PricingCalculator() {
  const [formData, setFormData] = useState<CalculatorFormData | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [hasDownloadedPDF, setHasDownloadedPDF] = useState(false);
  const { toast } = useToast();

  const handleFormComplete = (data: CalculatorFormData) => {
    const calculatedResults = calculatePricing(data);
    setFormData(data);
    setResults(calculatedResults);

    // Track calculation event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'pricing_calculation_complete', {
        event_category: 'pricing_calculator',
        event_label: data.productDetails.craftType,
      });
    }

    // Show email capture modal after viewing results
    setTimeout(() => {
      setShowEmailModal(true);
    }, 3000);
  };

  const handleEmailCaptureSuccess = async (email: string, firstName: string) => {
    if (formData && results) {
      try {
        // Generate PDF
        const pdfBlob = await generatePricingPDF(formData, results);
        downloadPricingPDF(pdfBlob, formData.productDetails.productName);
        setHasDownloadedPDF(true);

        toast({
          title: 'Success!',
          description: `Your pricing guide has been sent to ${email} and is downloading now.`,
        });

        // Track conversion
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            event_category: 'pricing_calculator',
            event_label: 'email_captured',
          });
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: 'PDF generation failed',
          description: 'Please contact support if this persists.',
          variant: 'destructive',
        });
      }
    }
    setShowEmailModal(false);
  };

  const handleReset = () => {
    setFormData(null);
    setResults(null);
    setShowEmailModal(false);
    setHasDownloadedPDF(false);
  };

  const handleShare = (platform: 'facebook' | 'twitter' | 'linkedin') => {
    const url = window.location.href;
    const text = `I just used this free pricing calculator to price my handmade products profitably! Every maker needs this tool.`;

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');

    // Track share event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share', {
        event_category: 'pricing_calculator',
        event_label: platform,
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Free Handmade Product Pricing Calculator - Price Your Crafts Profitably | CraftLocal</title>
        <meta
          name="description"
          content="Stop underpricing your handmade products. Free pricing calculator helps craft makers price profitably. Get instant recommendations for jewelry, woodwork, textiles, pottery & more."
        />
        <meta
          name="keywords"
          content="handmade pricing calculator, craft pricing, how to price handmade products, etsy pricing, wholesale calculator, maker pricing tool"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-green-600">100% Free Tool</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Handmade Product Pricing Calculator
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Stop underpricing your work. Calculate profitable prices in 5 minutes.
              <br />
              <span className="font-semibold text-green-600">
                Join 4,837+ makers who price with confidence.
              </span>
            </p>
          </motion.div>

          {/* Main Content */}
          <AnimatePresence mode="wait">
            {!results ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PricingCalculatorForm onComplete={handleFormComplete} />

                {/* Benefits Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 grid md:grid-cols-3 gap-6"
                >
                  <Card>
                    <CardHeader>
                      <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                      <CardTitle>Accurate Pricing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Calculate your true costs including materials, time, and overhead that most makers forget.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <DollarSign className="h-8 w-8 text-green-600 mb-2" />
                      <CardTitle>Channel-Specific Pricing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Get pricing for Etsy, craft fairs, wholesale, and CraftLocal marketplace with commission adjustments.
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Lightbulb className="h-8 w-8 text-green-600 mb-2" />
                      <CardTitle>Personalized Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Receive custom recommendations to increase profitability based on your specific situation.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Results Header */}
                <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-3xl mb-2">
                          Your Pricing Results
                        </CardTitle>
                        <CardDescription className="text-lg">
                          For: <span className="font-semibold text-foreground">{formData?.productDetails.productName}</span>
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Start Over
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                        <p className="text-sm text-muted-foreground mb-1">Recommended Retail Price</p>
                        <p className="text-3xl font-bold text-green-600">
                          {formatCurrency(results.breakdown.recommendedRetail)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">True Cost to Make</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(results.breakdown.trueCostToMake)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Profit Margin</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatPercentage(results.profitability.profitMargin)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Quick Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Effective Hourly Rate</p>
                        <p className="text-sm text-muted-foreground">
                          You're earning {formatCurrency(results.profitability.effectiveHourlyRate)}/hr after expenses
                          {results.profitability.effectiveHourlyRate < 20 && ' - consider increasing prices!'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium">Annual Income Potential</p>
                        <p className="text-sm text-muted-foreground">
                          At current pricing and volume: {formatCurrency(results.profitability.annualIncomePotential)}/year
                        </p>
                      </div>
                    </div>

                    {results.marketComparison.priceVsMarket !== 0 && (
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium">Market Comparison</p>
                          <p className="text-sm text-muted-foreground">
                            Your price is {Math.abs(results.marketComparison.priceVsMarket).toFixed(1)}%{' '}
                            {results.marketComparison.priceVsMarket > 0 ? 'above' : 'below'} market average
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Visualizations */}
                <PricingVisualizations
                  results={results}
                  productName={formData?.productDetails.productName || ''}
                />

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      Your Personalized Recommendations
                    </CardTitle>
                    <CardDescription>
                      Action steps to increase your profitability
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {results.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border-l-4 border-green-500 bg-gray-50 p-4 rounded-r-lg"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={
                                  rec.priority === 'high'
                                    ? 'destructive'
                                    : rec.priority === 'medium'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {rec.priority} priority
                              </Badge>
                              <Badge variant="outline">{rec.type}</Badge>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">{rec.title}</h3>
                            <p className="text-muted-foreground mb-2">{rec.description}</p>
                            <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              Impact: {rec.impact}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* CTA Section */}
                <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-blue-50">
                  <CardContent className="p-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Ready to Turn Your Pricing Into Sales?</h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                      Join CraftLocal marketplace where makers are valued. Lower fees than Etsy, free listing setup, and direct customer relationships.
                    </p>
                    <div className="flex flex-col md:flex-row gap-4 justify-center">
                      {!hasDownloadedPDF && (
                        <Button
                          size="lg"
                          onClick={() => setShowEmailModal(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Download className="mr-2 h-5 w-5" />
                          Download Complete PDF Guide
                        </Button>
                      )}
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => window.location.href = '/auth?mode=signup'}
                      >
                        List Your Products on CraftLocal
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Sharing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Share This Tool
                    </CardTitle>
                    <CardDescription>
                      Help other makers stop underpricing their work
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleShare('facebook')}
                        className="flex-1"
                      >
                        Share on Facebook
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleShare('twitter')}
                        className="flex-1"
                      >
                        Share on Twitter
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleShare('linkedin')}
                        className="flex-1"
                      >
                        Share on LinkedIn
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Email Capture Modal */}
      {formData && (
        <EmailCaptureModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSuccess={handleEmailCaptureSuccess}
          craftType={formData.productDetails.craftType}
        />
      )}
    </>
  );
}
