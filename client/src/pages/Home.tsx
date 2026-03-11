import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ShoppingCart, Zap, TrendingUp, Users } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Patel Electricals</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation("/products")}>
              Products
            </Button>
            {isAuthenticated && (
              <>
                <Button variant="ghost" onClick={() => setLocation("/cart")}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                </Button>
                <Button variant="ghost" onClick={() => setLocation("/profile")}>
                  Profile
                </Button>
                {user?.role === 'admin' && (
                  <Button variant="ghost" onClick={() => setLocation("/admin")}>
                    Admin
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="border-b border-border py-20">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                Wholesale Spare Parts for Your Business
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Quality electrical spare parts at competitive wholesale prices. Direct from manufacturer to your doorstep.
              </p>
              <div className="flex gap-4">
                <Button size="lg" onClick={() => setLocation("/products")}>
                  Browse Products
                </Button>
                {!isAuthenticated && (
                  <Button size="lg" variant="outline" onClick={() => window.location.href = '/api/oauth/login'}>
                    Register as Dealer
                  </Button>
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg h-64 flex items-center justify-center">
              <Zap className="h-32 w-32 text-primary/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Us</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Competitive Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Tiered pricing based on quantity. The more you buy, the more you save.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ShoppingCart className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Easy Ordering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Bulk add to cart, quotation requests, and flexible payment options.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Fast Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Real-time stock status and quick order processing with tracking.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Dealer Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dedicated sales rep, credit management, and WhatsApp support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 border-t border-b border-border py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of dealers who trust us for their wholesale spare parts needs.
          </p>
          <Button size="lg" onClick={() => setLocation("/products")}>
            Start Shopping Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About Us</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Products</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Catalog</a></li>
                <li><a href="#" className="hover:text-foreground">New Arrivals</a></li>
                <li><a href="#" className="hover:text-foreground">Best Sellers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground">Shipping Info</a></li>
                <li><a href="#" className="hover:text-foreground">Returns</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Phone: 8780657095</li>
                <li>Email: burhanghiya26@gmail.com</li>
                <li>Address: Udhana Asha Nagar, Pincode 394210</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Patel Electricals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
