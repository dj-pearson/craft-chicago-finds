import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp,
  Users,
  Search,
  TestTube,
  Shield,
  Eye,
  Target
} from "lucide-react";
import { ShopHealthScore } from "./ShopHealthScore";
import { SearchInsightCards } from "./SearchInsightCards";
import { ABTestSlots } from "./ABTestSlots";

interface SellerAnalyticsDashboardProps {
  className?: string;
}

export const SellerAnalyticsDashboard = ({ className }: SellerAnalyticsDashboardProps) => {
  const [activeTab, setActiveTab] = useState("health");

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Analytics & Insights</h1>
          </div>
          <p className="text-muted-foreground">
            Data-driven insights to optimize your shop performance and increase sales
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              <Eye className="h-3 w-3 mr-1" />
              Private Dashboard
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              <Target className="h-3 w-3 mr-1" />
              Actionable Insights
            </Badge>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Shop Health
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Insights
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              A/B Testing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="health" className="mt-6">
            <ShopHealthScore />
          </TabsContent>
          
          <TabsContent value="search" className="mt-6">
            <SearchInsightCards />
          </TabsContent>
          
          <TabsContent value="testing" className="mt-6">
            <ABTestSlots />
          </TabsContent>
        </Tabs>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                Shop Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">B+</div>
              <p className="text-xs text-muted-foreground">
                Good performance with room for improvement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-500" />
                Search Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">12</div>
              <p className="text-xs text-muted-foreground">
                High-potential search terms to optimize for
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TestTube className="h-4 w-4 text-purple-500" />
                Active Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">2</div>
              <p className="text-xs text-muted-foreground">
                A/B tests currently running
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
