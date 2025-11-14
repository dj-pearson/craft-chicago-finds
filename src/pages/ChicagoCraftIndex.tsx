import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, DollarSign, Package, Users, MapPin, Calendar, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useChicagoCraftIndexData } from "@/hooks/useChicagoCraftIndexData";
import { FAQSection, chicagoCraftEconomyFAQs } from "@/components/seo/FAQSection";

const ChicagoCraftIndex = () => {
  // Fetch real-time data from analytics tables
  const { data: indexData, isLoading, error } = useChicagoCraftIndexData();
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const seoConfig = {
    title: "Chicago Craft Economy Index | Real-Time Local Craft Commerce Data",
    description: "The first public index tracking Chicago's craft economy. See trending categories, average prices, popular neighborhoods, and seasonal trends. Data-driven insights from 500+ local makers and thousands of transactions.",
    keywords: [
      'Chicago craft economy',
      'craft market data Chicago',
      'handmade pricing trends',
      'Chicago maker statistics',
      'local craft commerce data',
      'artisan market intelligence',
      'Chicago craft trends',
      'maker economy index'
    ],
    canonical: `${window.location.origin}/chicago-craft-index`,
    openGraph: {
      title: "Chicago Craft Economy Index",
      description: "Real-time data on Chicago's craft economy. Trending categories, pricing, and local market intelligence.",
      type: 'website',
      url: `${window.location.origin}/chicago-craft-index`,
    },
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "Chicago Craft Economy Index",
        "description": "Public dataset tracking Chicago's local craft commerce economy including pricing trends, category performance, and market intelligence",
        "url": `${window.location.origin}/chicago-craft-index`,
        "temporalCoverage": "2024/..",
        "spatialCoverage": {
          "@type": "Place",
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "41.8781",
            "longitude": "-87.6298"
          },
          "name": "Chicago, IL"
        }
      }
    ]
  };

  // Add icons to key metrics from hook data
  const keyMetrics = indexData?.keyMetrics.map(metric => ({
    ...metric,
    icon: metric.label === "Active Makers" ? Users :
          metric.label === "Total Listings" ? Package :
          metric.label === "Avg Item Price" ? DollarSign :
          MapPin
  })) || [];

  // Transform seasonal data for display
  const seasonalInsights = indexData?.seasonalInsights.map(insight => ({
    season: insight.month,
    insight: `${insight.topCategory} trending at $${insight.avgPrice} avg. ${insight.seasonalNote}.`,
    confidence: "High"
  })) || [];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead config={seoConfig} />
        <Header />
        <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading Chicago Craft Economy Index...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead config={seoConfig} />
        <Header />
        <main className="container mx-auto px-4 py-16">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Error Loading Index Data</CardTitle>
              <CardDescription>
                We encountered an issue loading the Chicago Craft Economy Index. Please try again later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Error: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // No data state
  if (!indexData) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead config={seoConfig} />
        <Header />
        <main className="container mx-auto px-4 py-16">
          <Card>
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>
                The Chicago Craft Economy Index is currently unavailable. Please check back later.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead config={seoConfig} />
      <Header />

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto max-w-6xl">
            <Badge variant="secondary" className="mb-4">
              <Calendar className="w-4 h-4 mr-2" />
              Updated {currentMonth}
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Chicago Craft Economy Index
            </h1>

            <p className="text-xl text-muted-foreground mb-6 max-w-3xl">
              The first public index tracking Chicago's craft economy in real-time. Based on 500+ makers,
              8,400+ listings, and thousands of transactions. Free, transparent market intelligence for the creative community.
            </p>

            <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Data
              </span>
              <span>•</span>
              <span>Last updated: {indexData.lastUpdated.toLocaleDateString()}</span>
              <span>•</span>
              <span>Public Dataset</span>
            </div>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-2xl font-bold mb-6">Market Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {keyMetrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardDescription>{metric.label}</CardDescription>
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-1">{metric.value}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {metric.trend === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {metric.trend === "down" && <TrendingDown className="w-4 h-4 text-red-600" />}
                        {metric.trend === "neutral" && <Minus className="w-4 h-4" />}
                        <span>{metric.change}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trending Categories */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Trending Categories</h2>
              <p className="text-muted-foreground">What Chicago buyers are searching for this month</p>
            </div>

            <div className="grid gap-4">
              {indexData.trendingCategories.map((category, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{category.name}</h3>
                          <Badge variant={category.trend === "up" ? "default" : "secondary"}>
                            {category.trend === "up" ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {category.change > 0 ? "+" : ""}{category.change}%
                          </Badge>
                        </div>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          <span>Avg Price: <span className="font-semibold text-foreground">${category.avgPrice}</span></span>
                          <span>Searches: <span className="font-semibold text-foreground">{category.searches.toLocaleString()}</span></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Neighborhood Insights */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Popular Pickup Neighborhoods</h2>
              <p className="text-muted-foreground">Where buyers are choosing same-day pickup</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {indexData.neighborhoodData.map((neighborhood, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        {neighborhood.name}
                      </CardTitle>
                      <Badge variant="outline">{neighborhood.topCategory}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Pickups/Month</div>
                        <div className="text-2xl font-bold">{neighborhood.pickups}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Avg Order Value</div>
                        <div className="text-2xl font-bold">${neighborhood.avgOrderValue}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seasonal Insights */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Seasonal Intelligence</h2>
              <p className="text-muted-foreground">Predictions and trends for makers to plan inventory</p>
            </div>

            <div className="grid gap-4">
              {seasonalInsights.map((insight, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{insight.season}</CardTitle>
                      <Badge variant="outline">
                        {insight.confidence} Confidence
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{insight.insight}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About the Index */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>About the Chicago Craft Economy Index</CardTitle>
                <CardDescription>
                  Transparency builds stronger creative communities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  The Chicago Craft Economy Index is the first public dataset tracking local craft commerce.
                  We aggregate anonymized data from our platform to provide market intelligence that benefits the entire maker community.
                </p>

                <div className="space-y-2">
                  <h4 className="font-semibold">Data Sources:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>500+ active Chicago makers</li>
                    <li>8,400+ product listings with pricing data</li>
                    <li>Search analytics (trending categories, keywords)</li>
                    <li>Order data (anonymized, aggregated)</li>
                    <li>Neighborhood pickup patterns</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Privacy Commitment:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>All data is anonymized and aggregated</li>
                    <li>No individual seller or buyer information is shared</li>
                    <li>Minimum thresholds ensure privacy protection</li>
                  </ul>
                </div>

                <p className="text-sm text-muted-foreground pt-4 border-t">
                  Updated monthly with quarterly "State of Chicago Craft" reports.
                  For media inquiries or custom research: <a href="mailto:index@craftchicagofinds.com" className="text-primary hover:underline">index@craftchicagofinds.com</a>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section - Optimized for AI Search (GEO) */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <FAQSection
              title="Chicago Craft Economy - Frequently Asked Questions"
              faqs={chicagoCraftEconomyFAQs}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ChicagoCraftIndex;
