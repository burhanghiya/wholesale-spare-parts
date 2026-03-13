import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Zap, ShoppingCart, Search, Package, Truck, Shield, Phone, Mail, MapPin, ArrowRight, TrendingUp, Clock, MessageCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const WHATSAPP_NUMBER = "918780657095";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Patel%20Electricals%2C%20I%20need%20help%20with%20spare%20parts`;

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === 'admin' });
  const { data: categories, isLoading: catsLoading } = trpc.products.getCategories.useQuery();

  // Fallback stats
  const displayStats = [
    { label: "Products", value: stats?.totalProducts ? `${stats.totalProducts}+` : "Loading...", icon: Package },
    { label: "Dealers", value: stats?.totalUsers ? `${stats.totalUsers}+` : "Loading...", icon: Truck },
    { label: "Orders", value: stats?.totalOrders ? `${stats.totalOrders}+` : "Loading...", icon: ShoppingCart },
    { label: "Years", value: "15+", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="bg-[oklch(0.22_0.05_260)] text-white text-sm">
        <div className="container flex items-center justify-between py-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> 8780657095</span>
            <span className="hidden sm:flex items-center gap-1"><Mail className="h-3 w-3" /> burhanghiya26@gmail.com</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="hidden sm:inline">Udhana, Surat - 394210</span>
            <span className="sm:hidden">Surat</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.22_0.05_260)]">
              <Zap className="h-5 w-5 text-[oklch(0.65_0.15_85)]" />
            </div>
            <div>
              <span className="text-lg font-bold leading-none">Patel Electricals</span>
              <span className="block text-[10px] text-muted-foreground font-medium tracking-wider uppercase">Wholesale Spare Parts</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" className="font-medium" onClick={() => setLocation("/")}>Home</Button>
            <Button variant="ghost" className="font-medium" onClick={() => setLocation("/products")}>Products</Button>
            {isAuthenticated && (
              <>
                <Button variant="ghost" className="font-medium" onClick={() => setLocation("/cart")}><ShoppingCart className="h-4 w-4 mr-1.5" />Cart</Button>
                <Button variant="ghost" className="font-medium" onClick={() => setLocation("/profile")}>My Orders</Button>
                {user?.role === "admin" && <Button variant="ghost" className="font-medium text-[oklch(0.65_0.15_85)]" onClick={() => setLocation("/admin")}>Admin Panel</Button>}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm text-muted-foreground">Hi, <span className="font-semibold text-foreground">{user?.name || "Dealer"}</span></span>
                <Button variant="outline" size="sm" onClick={() => setLocation("/profile")}>Profile</Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => window.location.href = getLoginUrl()}>Login / Register</Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.22_0.05_260)] via-[oklch(0.28_0.06_260)] to-[oklch(0.22_0.05_260)]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, oklch(0.65 0.15 85) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
        <div className="container relative py-20 md:py-28">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div>
              <Badge className="mb-4 bg-[oklch(0.65_0.15_85)] text-[oklch(0.15_0.04_260)] font-semibold px-3 py-1">Trusted Wholesale Partner</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Wholesale <span className="text-[oklch(0.65_0.15_85)]">Electrical</span> Spare Parts
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
                India's trusted B2B platform for electrical spare parts. Get competitive wholesale prices, bulk discounts, and doorstep delivery across Gujarat.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-[oklch(0.65_0.15_85)] text-[oklch(0.15_0.04_260)] hover:bg-[oklch(0.70_0.15_85)] font-semibold px-8" onClick={() => setLocation("/products")}>
                  Browse Catalog <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Us
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {displayStats.map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <stat.icon className="h-8 w-8 text-[oklch(0.65_0.15_85)] mb-3" />
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Shop by Category</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Browse our extensive range of electrical spare parts organized by category</p>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {catsLoading ? (
              <div className="col-span-full flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : categories && categories.length > 0 ? (
              categories.map((cat) => (
                <Card key={cat.id} className="group cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300" onClick={() => setLocation("/products")}>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">📦</div>
                    <h3 className="font-semibold text-sm mb-1">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground">{cat.description || "Parts"}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground">No categories available</div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-secondary/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Why Dealers Choose Us</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need for your wholesale electrical parts business</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Search, title: "Smart Part Search", desc: "Find parts by number, model, or brand. Cross-reference alternate part numbers." },
              { icon: TrendingUp, title: "Tiered Wholesale Pricing", desc: "Buy more, save more. Volume-based discounts up to 25% on bulk orders." },
              { icon: Shield, title: "100% Genuine Parts", desc: "All products sourced directly from authorized manufacturers and distributors." },
              { icon: Truck, title: "Fast Delivery", desc: "Quick dispatch for in-stock items. Real-time order tracking available." },
              { icon: MessageCircle, title: "WhatsApp Support", desc: "Quick assistance via WhatsApp. Get quotes, track orders, and resolve issues." },
              { icon: Package, title: "Bulk Order Management", desc: "Easy bulk ordering system with quotation requests and order history." },
            ].map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.22_0.05_260)] to-[oklch(0.30_0.06_260)]" />
        <div className="container relative text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Ordering?</h2>
          <p className="text-white/70 mb-8 max-w-2xl mx-auto">Register as a dealer today and get access to wholesale prices, bulk discounts, and fast delivery.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-[oklch(0.65_0.15_85)] text-[oklch(0.15_0.04_260)] hover:bg-[oklch(0.70_0.15_85)] font-semibold px-8" onClick={() => setLocation("/products")}>
              Browse Products <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => window.open(WHATSAPP_URL, "_blank")}>
              <Phone className="mr-2 h-4 w-4" /> Call: 8780657095
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[oklch(0.18_0.04_260)] text-white pt-12 pb-6">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[oklch(0.65_0.15_85)]">
                  <Zap className="h-4 w-4 text-[oklch(0.15_0.04_260)]" />
                </div>
                <span className="font-bold">Patel Electricals</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">Your trusted wholesale partner for electrical spare parts since 2010.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[oklch(0.65_0.15_85)]">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="/products" className="hover:text-white transition-colors">All Products</a></li>
                <li><a href="/products" className="hover:text-white transition-colors">New Arrivals</a></li>
                <li><a href="/products" className="hover:text-white transition-colors">Best Sellers</a></li>
                <li><a href="/products" className="hover:text-white transition-colors">Bulk Orders</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[oklch(0.65_0.15_85)]">Support</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Return Policy</a></li>

                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[oklch(0.65_0.15_85)]">Contact Us</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>8780657095</span></li>
                <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>burhanghiya26@gmail.com</span></li>
                <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>Udhana Asha Nagar, near Madhi ni Khamni, Surat - 394210</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/40">&copy; 2026 Patel Electricals. All rights reserved.</p>

          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors hover:scale-110" title="Chat on WhatsApp">
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
