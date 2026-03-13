import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AdminNav } from "./AdminDashboard";
import { toast } from "sonner";
import { AlertCircle, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminShipping() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: shippingRates, isLoading } = trpc.admin.getShippingRates.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === 'admin' }
  );

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    costPerKm: 0,
    baseCost: 0,
  });

  const updateShippingRate = trpc.admin.updateShippingRate.useMutation({
    onSuccess: () => {
      toast.success("Shipping rate updated successfully!");
      setEditingId(null);
      trpc.useUtils().admin.getShippingRates.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleEdit = (rate: any) => {
    setEditingId(rate.id);
    setFormData({
      costPerKm: Number(rate.costPerKm) || 0,
      baseCost: Number(rate.baseCost) || 0,
    });
  };

  const handleSave = () => {
    if (editingId === null) return;
    updateShippingRate.mutate({
      id: editingId,
      costPerKm: formData.costPerKm,
      baseCost: formData.baseCost,
    });
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
            <Button onClick={() => setLocation("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNav current="/admin/shipping" />
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-2">Shipping Configuration</h1>
        <p className="text-muted-foreground mb-8">Manage shipping rates and charges</p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {shippingRates?.map((rate: any) => (
              <Card key={rate.id}>
                <CardHeader>
                  <CardTitle className="text-base">Shipping Rate Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingId === rate.id ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Base Cost (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.baseCost}
                            onChange={(e) => setFormData({ ...formData, baseCost: Number(e.target.value) })}
                            placeholder="Base shipping cost"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Fixed cost for all orders</p>
                        </div>
                        <div>
                          <Label>Cost Per Km (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.costPerKm}
                            onChange={(e) => setFormData({ ...formData, costPerKm: Number(e.target.value) })}
                            placeholder="Cost per kilometre"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Charge per kilometre distance</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Example:</strong> Base Cost: ₹50, Cost Per Km: ₹5<br />
                          For 100km distance: ₹50 + (100 × ₹5) = ₹550
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          disabled={updateShippingRate.isPending}
                          className="flex-1"
                        >
                          {updateShippingRate.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Base Cost</p>
                          <p className="text-lg font-semibold">₹{Number(rate.baseCost || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cost Per Km</p>
                          <p className="text-lg font-semibold">₹{Number(rate.costPerKm || 0).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Current Formula:</strong><br />
                          Total Shipping = ₹{Number(rate.baseCost || 0).toFixed(2)} + (Distance × ₹{Number(rate.costPerKm || 0).toFixed(2)})
                        </p>
                      </div>

                      <Button
                        onClick={() => handleEdit(rate)}
                        className="w-full"
                      >
                        Edit Shipping Rates
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}

            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base">How Shipping Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. Customers enter their distance from warehouse during checkout</p>
                <p>2. System automatically calculates shipping cost using the formula above</p>
                <p>3. Shipping cost is added to order total</p>
                <p>4. You can update rates anytime - changes apply to all new orders</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
