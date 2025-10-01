import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MapPin, ShoppingBag, Users, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  description: string | null;
  is_active: boolean;
  launch_date: string | null;
}

const Landing = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase
          .from("cities")
          .select("*")
          .order("is_active", { ascending: false })
          .order("name", { ascending: true });

        if (error) {
          console.error("Error fetching cities:", error);
          return;
        }

        setCities(data || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Discover Local Makers
              <span className="text-primary block">In Your City</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with talented artisans and makers in your community. Shop handmade goods, support local creators, and find unique treasures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {cities.find(c => c.is_active) && (
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to={`/${cities.find(c => c.is_active)?.slug}`}>
                    Shop {cities.find(c => c.is_active)?.name} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" className="text-lg px-8">
                Request Your City
              </Button>
            </div>
          </div>
        </section>

        {/* Available Cities */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Available Cities</h2>
            {loading ? (
              <div className="text-center py-8" style={{ minHeight: '400px' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading cities...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto" style={{ minHeight: '400px' }}>
                {cities.map((city) => (
                  <Card 
                    key={city.id} 
                    className={`hover:shadow-lg transition-shadow ${city.is_active ? 'cursor-pointer group' : 'opacity-50'}`}
                  >
                    {city.is_active ? (
                      <Link to={`/${city.slug}`}>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <MapPin className="h-6 w-6 text-primary" />
                            <CardTitle className="group-hover:text-primary transition-colors">
                              {city.name}
                            </CardTitle>
                          </div>
                          <CardDescription>
                            Active marketplace • Browse makers
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {city.description}
                          </p>
                        </CardContent>
                      </Link>
                    ) : (
                      <>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                            <CardTitle className="text-muted-foreground">
                              {city.name}
                            </CardTitle>
                          </div>
                          <CardDescription>
                            Coming {city.launch_date ? new Date(city.launch_date).getFullYear() : 'Soon'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {city.description}
                          </p>
                        </CardContent>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Craft Local?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Local Pickup Available</h3>
                <p className="text-muted-foreground">
                  Skip shipping costs and meet makers in person. Many items available for local pickup.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Support Your Community</h3>
                <p className="text-muted-foreground">
                  Every purchase directly supports local artisans and keeps money in your community.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Unique & Handmade</h3>
                <p className="text-muted-foreground">
                  Find one-of-a-kind items you won't see anywhere else, crafted with care and attention.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="font-bold text-lg mb-4">Local Makers</div>
              <p className="text-sm text-muted-foreground">
                Connecting communities with local artisans and makers across the Midwest.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Buyers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/chicago" className="hover:text-foreground">Browse Cities</Link></li>
                <li><a href="#" className="hover:text-foreground">How It Works</a></li>
                <li><a href="#" className="hover:text-foreground">Pickup Guide</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Sellers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Start Selling</a></li>
                <li><a href="#" className="hover:text-foreground">Seller Guide</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground">Request City</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Local Makers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;