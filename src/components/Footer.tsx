import { MapPin, Mail, Phone, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CM</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Chicago Makers</h3>
                <p className="text-xs text-background/70">Local Handmade Marketplace</p>
              </div>
            </div>
            <p className="text-background/80 text-sm leading-relaxed mb-4">
              Supporting local artisans and connecting Chicago with unique handmade goods since 2024.
            </p>
            <div className="flex items-center text-background/80 text-sm">
              <Heart className="w-4 h-4 mr-2 text-accent" />
              Made with love in Chicago
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">All Categories</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">New Arrivals</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Featured Makers</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Gift Cards</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Local Pickup</a></li>
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Sell</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Start Selling</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Seller Guidelines</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Pricing Tips</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Photography Guide</a></li>
              <li><a href="#" className="text-background/80 hover:text-background transition-colors">Success Stories</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Stay Connected</h4>
            <p className="text-background/80 text-sm mb-4">
              Get updates on new makers, featured products, and local events.
            </p>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input 
                  type="email" 
                  placeholder="Your email"
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/60"
                />
                <Button 
                  variant="secondary"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  Subscribe
                </Button>
              </div>
              
              {/* Contact Info */}
              <div className="pt-4 space-y-2 text-sm text-background/80">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Chicago, IL
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  hello@chicagomakers.com
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  (312) 555-MAKE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-background/60 text-sm">
              © 2024 Chicago Makers. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-background/60 hover:text-background transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-background/60 hover:text-background transition-colors text-sm">
                Help Center
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};