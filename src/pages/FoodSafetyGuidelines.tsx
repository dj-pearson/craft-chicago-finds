import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ShieldCheck, Utensils } from "lucide-react";

const FoodSafetyGuidelines = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <Utensils className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Food Safety Guidelines for Sellers</h1>
        </div>

        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Critical Food Safety Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-900 font-semibold">
              All food sellers must comply with federal, state, and local food safety regulations. 
              Non-compliance can result in immediate listing removal and account suspension.
            </p>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Legal Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Cottage Food Laws</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Most states have "Cottage Food Laws" that allow home-based food production with restrictions:
              </p>
              <ul className="text-sm space-y-1 ml-4">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Annual revenue caps (typically $15,000-$50,000)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Allowed food types (usually non-potentially hazardous foods only)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Required labeling and disclosures</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Sales location restrictions (some states require in-person sales only)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Commercial Kitchen Licenses</h3>
              <p className="text-sm text-muted-foreground">
                If your food products don't qualify under cottage food laws, you must use a licensed commercial kitchen 
                and obtain proper health department permits.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Food Handler Certification</h3>
              <p className="text-sm text-muted-foreground">
                Most jurisdictions require food handlers to complete a food safety certification course. 
                Check your local health department requirements.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Prohibited Food Items (Home Kitchen)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              The following are generally prohibited from home kitchen production under cottage food laws:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start">
                <span className="text-destructive mr-2">✗</span>
                <span>Meat, poultry, or fish products</span>
              </li>
              <li className="flex items-start">
                <span className="text-destructive mr-2">✗</span>
                <span>Dairy products (milk, cheese, yogurt, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="text-destructive mr-2">✗</span>
                <span>Foods requiring refrigeration for safety</span>
              </li>
              <li className="flex items-start">
                <span className="text-destructive mr-2">✗</span>
                <span>Canned goods (unless pressure-canned in licensed facility)</span>
              </li>
              <li className="flex items-start">
                <span className="text-destructive mr-2">✗</span>
                <span>Fermented foods (kombucha, kimchi, etc.) in some states</span>
              </li>
              <li className="flex items-start">
                <span className="text-destructive mr-2">✗</span>
                <span>Foods with cream or custard fillings</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. Required Labeling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              All packaged food products must include the following on the label:
            </p>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded">
                <p className="font-semibold mb-1">Product Name</p>
                <p className="text-muted-foreground">Clear description of what the product is</p>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <p className="font-semibold mb-1">Ingredient List</p>
                <p className="text-muted-foreground">Listed in descending order by weight</p>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <p className="font-semibold mb-1">Allergen Statement</p>
                <p className="text-muted-foreground">
                  <strong>CRITICAL:</strong> Must clearly identify all major allergens (milk, eggs, fish, shellfish, 
                  tree nuts, peanuts, wheat, soybeans, sesame)
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <p className="font-semibold mb-1">Net Weight or Volume</p>
                <p className="text-muted-foreground">Accurate measurement of product quantity</p>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <p className="font-semibold mb-1">Business Name & Address</p>
                <p className="text-muted-foreground">Your legal business name and physical address</p>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <p className="font-semibold mb-1">Cottage Food Disclaimer (if applicable)</p>
                <p className="text-muted-foreground">
                  Example: "This product was produced in a home kitchen not subject to public health inspection 
                  that may also process common food allergens."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              4. Safe Food Handling Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-3">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>Personal Hygiene:</strong> Wash hands frequently, wear clean clothes, tie back hair, no jewelry</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>Temperature Control:</strong> Keep hot foods hot (above 140°F) and cold foods cold (below 40°F)</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>Cross-Contamination Prevention:</strong> Use separate cutting boards for raw/cooked foods, clean and sanitize all surfaces</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>Storage:</strong> Store food off the floor, in clean containers, away from chemicals</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span><strong>Packaging:</strong> Use food-grade packaging materials, seal properly to prevent contamination</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Online Listing Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              When listing food products on Craft Local, you must:
            </p>
            <ul className="text-sm space-y-2">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Include complete ingredient lists in the product description</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Clearly mark all allergens in bold or capital letters</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>State shelf life and storage instructions</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Include cottage food disclaimer if applicable</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Provide handling/preparation instructions if needed</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-6">
            <p className="text-sm text-destructive font-semibold mb-2">
              Violation Consequences:
            </p>
            <ul className="text-sm space-y-1">
              <li>• First violation: Warning and 48-hour corrective action period</li>
              <li>• Second violation: Temporary suspension of food listings</li>
              <li>• Third violation or severe safety issue: Permanent ban from selling food items</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <p className="text-sm text-blue-900">
              <strong>Resources:</strong> Contact your local health department for specific requirements in your area. 
              For questions, email foodsafety@craftlocal.net
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default FoodSafetyGuidelines;
