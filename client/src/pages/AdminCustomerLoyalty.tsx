import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Gift, Search } from "lucide-react";
import { AdminNav } from "./AdminDashboard";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function AdminCustomerLoyalty() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - replace with actual tRPC query
  const customers = [
    { id: 1, name: "Burhan Ghiya", email: "burhanghiya32@gmail.com", currentPoints: 2450, totalEarned: 5000, totalRedeemed: 2550, lastOrderDate: "2026-03-26" },
    { id: 2, name: "Raj Patel", email: "raj.patel@email.com", currentPoints: 1200, totalEarned: 2000, totalRedeemed: 800, lastOrderDate: "2026-03-25" },
    { id: 3, name: "Priya Singh", email: "priya.singh@email.com", currentPoints: 3500, totalEarned: 4500, totalRedeemed: 1000, lastOrderDate: "2026-03-24" },
    { id: 4, name: "Amit Kumar", email: "amit.kumar@email.com", currentPoints: 500, totalEarned: 1000, totalRedeemed: 500, lastOrderDate: "2026-03-23" },
    { id: 5, name: "Neha Sharma", email: "neha.sharma@email.com", currentPoints: 0, totalEarned: 0, totalRedeemed: 0, lastOrderDate: null },
  ];

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <>
      <AdminNav current="/admin/customer-loyalty" />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Gift className="h-8 w-8" />
            Customer Loyalty Points
          </h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Customers</p>
                <p className="text-3xl font-bold">{customers.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Points Issued</p>
                <p className="text-3xl font-bold">{customers.reduce((sum, c) => sum + c.totalEarned, 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Points Redeemed</p>
                <p className="text-3xl font-bold">{customers.reduce((sum, c) => sum + c.totalRedeemed, 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Outstanding Points</p>
                <p className="text-3xl font-bold text-primary">{customers.reduce((sum, c) => sum + c.currentPoints, 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Search className="h-5 w-5 text-muted-foreground mt-2.5" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          <Card>
            <CardHeader>
              <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Customer Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-center py-3 px-4 font-semibold">Current Points</th>
                      <th className="text-center py-3 px-4 font-semibold">Total Earned</th>
                      <th className="text-center py-3 px-4 font-semibold">Total Redeemed</th>
                      <th className="text-left py-3 px-4 font-semibold">Last Order</th>
                      <th className="text-center py-3 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted-foreground">
                          No customers found
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 font-medium">{customer.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{customer.email}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-primary">{customer.currentPoints.toLocaleString()}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-green-600 font-semibold">
                            +{customer.totalEarned.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center text-amber-600 font-semibold">
                            -{customer.totalRedeemed.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {customer.lastOrderDate ? (
                              <span className="text-muted-foreground">
                                {new Date(customer.lastOrderDate).toLocaleDateString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">No orders</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {customer.currentPoints > 0 ? (
                              <Badge variant="secondary">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
