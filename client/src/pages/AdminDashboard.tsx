import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Package, ShoppingCart, Users, FileText, TrendingUp, AlertCircle,
  Zap, ArrowRight, LogOut
} from "lucide-react";

function AdminNav({ current }: { current: string }) {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const navItems = [
    { label: "Dashboard", path: "/admin" },
    { label: "Products", path: "/admin/products" },
    { label: "Orders", path: "/admin/orders" },
    { label: "Quotations", path: "/admin/quotations" },
    { label: "Dealers", path: "/admin/dealers" },
  ];
  return (
    <div className="bg-[oklch(0.22_0.05_260)] text-white">
      <div className="container py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/admin")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.65_0.15_85)]">
            <Zap className="h-5 w-5 text-[oklch(0.15_0.04_260)]" />
          </div>
          <div>
            <span className="text-lg font-bold">Admin Panel</span>
            <span className="block text-xs text-white/60">Patel Electricals</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={() => setLocation("/")}>View Website</Button>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={() => { logout(); setLocation("/"); }}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </div>
      <div className="container flex gap-1 pb-0 overflow-x-auto">
        {navItems.map((item) => (
          <Button key={item.path} variant="ghost" size="sm"
            className={`text-white/70 hover:text-white rounded-b-none border-b-2 ${
              current === item.path ? "border-[oklch(0.65_0.15_85)] text-white" : "border-transparent"
            }`}
            onClick={() => setLocation(item.path)}>{item.label}</Button>
        ))}
      </div>
    </div>
  );
}

export { AdminNav };

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.admin.stats.useQuery(undefined, { enabled: isAuthenticated && user?.role === 'admin' });

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full"><CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </CardContent></Card>
      </div>
    );
  }

  const statCards = [
    { label: "Total Products", value: stats?.totalProducts || 0, icon: Package, color: "text-blue-600", bg: "bg-blue-50", link: "/admin/products" },
    { label: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-green-600", bg: "bg-green-50", link: "/admin/orders" },
    { label: "Total Revenue", value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50", link: "/admin/orders" },
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50", link: "/admin/dealers" },
    { label: "Pending Orders", value: stats?.pendingOrders || 0, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", link: "/admin/orders" },
    { label: "Pending Quotes", value: stats?.pendingQuotations || 0, icon: FileText, color: "text-orange-600", bg: "bg-orange-50", link: "/admin/quotations" },
  ];

  const quickLinks = [
    { label: "Add New Product", desc: "Add a new spare part to catalog", icon: Package, link: "/admin/products" },
    { label: "Manage Orders", desc: "View and update order statuses", icon: ShoppingCart, link: "/admin/orders" },
    { label: "Quotation Requests", desc: "Review and respond to quotes", icon: FileText, link: "/admin/quotations" },
    { label: "Dealer Management", desc: "Manage dealers and credit limits", icon: Users, link: "/admin/dealers" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminNav current="/admin" />
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Welcome back, {user?.name || "Admin"}</p>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(stat.link)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{isLoading ? "..." : stat.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Card key={link.label} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group" onClick={() => setLocation(link.link)}>
              <CardContent className="p-5">
                <link.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">{link.label}</h3>
                <p className="text-sm text-muted-foreground">{link.desc}</p>
                <ArrowRight className="h-4 w-4 text-primary mt-3 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
