import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const ProhibitedItems = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" role="main" className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <h1 className="text-4xl font-bold">Prohibited Items Policy</h1>
        </div>
        
        <Card className="mb-6 border-destructive/50">
          <CardHeader>
            <CardTitle>Items NOT Allowed on Craft Local</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              To maintain a safe and legal marketplace, the following items are strictly prohibited from being listed or sold on Craft Local:
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Illegal, Dangerous, or Regulated Items</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul>
              <li>Illegal drugs, drug paraphernalia, or controlled substances</li>
              <li>Weapons, firearms, ammunition, or explosives</li>
              <li>Stolen goods or items that infringe on intellectual property</li>
              <li>Counterfeit or replica items</li>
              <li>Tobacco, vaping products, or e-cigarettes</li>
              <li>Alcohol (unless properly licensed and compliant with state laws)</li>
              <li>Prescription medications or medical devices</li>
              <li>Hazardous materials or chemicals</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Adult Content & Services</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul>
              <li>Adult content, pornography, or sexually explicit materials</li>
              <li>Escort services or sexual services of any kind</li>
              <li>Items promoting or glorifying violence or hate</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Animals & Living Things</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul>
              <li>Live animals (pets, livestock, etc.)</li>
              <li>Animal parts from endangered or protected species</li>
              <li>Live plants requiring agricultural permits</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Food Items - Special Requirements</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p className="font-semibold mb-2">Food items ARE allowed BUT must comply with:</p>
            <ul>
              <li>All local health department regulations</li>
              <li>Cottage food laws (if applicable in your state)</li>
              <li>Proper food handler certifications</li>
              <li>Clear allergen labeling (contains nuts, dairy, gluten, etc.)</li>
              <li>Ingredient lists and nutritional information (where required)</li>
              <li>Safe food handling and storage practices</li>
              <li>Expiration dates clearly displayed</li>
            </ul>
            <p className="mt-4 text-destructive font-semibold">
              Sellers are solely responsible for compliance with all food safety regulations. 
              Violations may result in immediate account suspension.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Misleading or Fraudulent Listings</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul>
              <li>False or misleading product descriptions</li>
              <li>Bait-and-switch tactics</li>
              <li>Pyramid schemes or multi-level marketing</li>
              <li>Items that cannot be fulfilled as described</li>
              <li>Listings for services not directly related to handmade/artisan goods</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Suspicious Activity</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>
              If you encounter a listing that violates this policy, please report it immediately using the 
              "Report Suspicious Activity" button on the product page, or email us at:
            </p>
            <p className="mt-2 font-semibold">
              report@craftlocal.net
            </p>
            <p className="mt-4">
              We review all reports within 24 hours and take appropriate action, including listing removal 
              and account suspension for repeat offenders.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Consequences of Violations</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul>
              <li><strong>First Offense:</strong> Warning and listing removal</li>
              <li><strong>Second Offense:</strong> 30-day account suspension</li>
              <li><strong>Third Offense:</strong> Permanent account termination</li>
              <li><strong>Severe Violations:</strong> Immediate permanent ban and reporting to authorities if applicable</li>
            </ul>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-8">
          This policy may be updated periodically. Last Updated: {new Date().toLocaleDateString()}
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default ProhibitedItems;
