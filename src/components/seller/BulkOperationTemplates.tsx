import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Gift,
  Snowflake,
  Sun,
  Zap,
  Package,
  Sparkles,
  TrendingDown,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

interface OperationTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  operations: {
    type: "price" | "status" | "tags" | "shipping";
    action: string;
    value: any;
  }[];
  category?: string;
  seasonal?: boolean;
}

const TEMPLATES: OperationTemplate[] = [
  {
    id: "holiday-sale-20",
    name: "Holiday Sale - 20% Off",
    description: "Apply 20% discount to all active listings for holiday sales",
    icon: Gift,
    color: "text-red-600",
    category: "Seasonal",
    seasonal: true,
    operations: [
      { type: "price", action: "Reduce by 20%", value: -20 },
      { type: "tags", action: "Add tag", value: "holiday-sale" }
    ]
  },
  {
    id: "flash-sale-15",
    name: "Flash Sale - 15% Off",
    description: "Quick 15% discount for limited time promotions",
    icon: Zap,
    color: "text-yellow-600",
    category: "Promotions",
    operations: [
      { type: "price", action: "Reduce by 15%", value: -15 },
      { type: "tags", action: "Add tag", value: "flash-sale" }
    ]
  },
  {
    id: "winter-clearance",
    name: "Winter Clearance - 30% Off",
    description: "Deep discount for end-of-season clearance",
    icon: Snowflake,
    color: "text-blue-600",
    category: "Seasonal",
    seasonal: true,
    operations: [
      { type: "price", action: "Reduce by 30%", value: -30 },
      { type: "tags", action: "Add tag", value: "clearance" }
    ]
  },
  {
    id: "summer-promo",
    name: "Summer Sale - 25% Off",
    description: "Seasonal summer promotion for warm weather items",
    icon: Sun,
    color: "text-orange-600",
    category: "Seasonal",
    seasonal: true,
    operations: [
      { type: "price", action: "Reduce by 25%", value: -25 },
      { type: "tags", action: "Add tag", value: "summer-sale" }
    ]
  },
  {
    id: "new-year-boost",
    name: "New Year Boost - 10% Off",
    description: "Start the year with a modest promotion",
    icon: Sparkles,
    color: "text-purple-600",
    category: "Seasonal",
    seasonal: true,
    operations: [
      { type: "price", action: "Reduce by 10%", value: -10 },
      { type: "tags", action: "Add tag", value: "new-year" }
    ]
  },
  {
    id: "clearance-deep",
    name: "Deep Clearance - 40% Off",
    description: "Maximum discount to clear out old inventory",
    icon: TrendingDown,
    color: "text-red-700",
    category: "Clearance",
    operations: [
      { type: "price", action: "Reduce by 40%", value: -40 },
      { type: "tags", action: "Add tag", value: "final-sale" }
    ]
  },
  {
    id: "enable-shipping-all",
    name: "Enable Shipping for All",
    description: "Add shipping option to all active listings",
    icon: Package,
    color: "text-green-600",
    category: "Operations",
    operations: [
      { type: "shipping", action: "Enable shipping", value: true }
    ]
  },
  {
    id: "seasonal-pause",
    name: "Seasonal Pause",
    description: "Temporarily deactivate all listings (e.g., for vacation)",
    icon: Calendar,
    color: "text-gray-600",
    category: "Operations",
    operations: [
      { type: "status", action: "Set to draft", value: "draft" }
    ]
  },
];

interface BulkOperationTemplatesProps {
  onApplyTemplate: (template: OperationTemplate) => void;
  className?: string;
}

export const BulkOperationTemplates = ({ onApplyTemplate, className }: BulkOperationTemplatesProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<OperationTemplate | null>(null);

  const handleApply = () => {
    if (selectedTemplate) {
      onApplyTemplate(selectedTemplate);
      setDialogOpen(false);
      setSelectedTemplate(null);
      toast.success(`"${selectedTemplate.name}" template applied! Preview the changes before confirming.`);
    }
  };

  const categories = Array.from(new Set(TEMPLATES.map(t => t.category || "Other")));

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className={`gap-2 ${className}`}>
            <Sparkles className="h-4 w-4" />
            Use Template
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Bulk Operation Templates
            </DialogTitle>
            <DialogDescription>
              Apply common bulk operations with pre-configured settings
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {categories.map(category => {
              const categoryTemplates = TEMPLATES.filter(t => (t.category || "Other") === category);
              return (
                <div key={category} className="mb-6">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryTemplates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <Card
                          key={template.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedTemplate?.id === template.id ? 'border-primary ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 bg-muted rounded-lg ${template.color}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{template.name}</h4>
                                  {template.seasonal && (
                                    <Badge variant="secondary" className="text-xs">
                                      Seasonal
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {template.description}
                                </p>
                                <div className="space-y-1">
                                  {template.operations.map((op, idx) => (
                                    <div key={idx} className="text-xs flex items-center gap-1">
                                      <div className="w-1 h-1 rounded-full bg-primary"></div>
                                      <span className="text-muted-foreground">{op.action}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={!selectedTemplate}>
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
