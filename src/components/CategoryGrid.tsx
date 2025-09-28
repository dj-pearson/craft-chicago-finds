import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const categories = [
  {
    name: "Jewelry & Accessories",
    itemCount: "150+ items",
    icon: "💎",
    gradient: "from-accent/20 to-accent/10",
  },
  {
    name: "Home & Decor",
    itemCount: "200+ items",
    icon: "🏠",
    gradient: "from-primary/20 to-primary/10",
  },
  {
    name: "Art & Prints",
    itemCount: "120+ items",
    icon: "🎨",
    gradient: "from-success/20 to-success/10",
  },
  {
    name: "Pottery & Ceramics",
    itemCount: "80+ items",
    icon: "🏺",
    gradient: "from-warning/20 to-warning/10",
  },
  {
    name: "Textiles & Clothing",
    itemCount: "90+ items",
    icon: "🧵",
    gradient: "from-accent/20 to-primary/10",
  },
  {
    name: "Woodworking",
    itemCount: "60+ items",
    icon: "🪵",
    gradient: "from-primary/20 to-accent/10",
  },
];

export const CategoryGrid = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore unique handmade goods across different categories, all crafted by local Chicago artisans.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {categories.map((category, index) => (
            <Card 
              key={index}
              className="group hover:shadow-elevated transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/20"
            >
              <CardContent className="p-6">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <Badge variant="secondary" className="mb-4">
                  {category.itemCount}
                </Badge>
                <p className="text-muted-foreground text-sm">
                  Discover unique {category.name.toLowerCase()} made by local artisans
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            className="hover:bg-primary hover:text-primary-foreground"
          >
            View All Categories
          </Button>
        </div>
      </div>
    </section>
  );
};