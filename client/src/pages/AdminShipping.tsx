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
  const utils = trpc.useUtils();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    minDistance: 0,
    maxDistance: 100,
    baseCost: 0,
  });

  const updateShippingRate = trpc.admin.updateShippingRate.useMutation({
    onSuccess: () => {
      toast.success("Shipping rate updated successfully!");
      setEditingId(null);
      utils.admin.getShippingRates.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleEdit = (rate: any) => {
    setEditingId(rate.id);
    setFormData({
      minDistance: Number(rate.minDistance) || 0,
      maxDistance: Number(rate.maxDistance) || 100,
      baseCost: Number(rate.baseCost) || 0,
    });
  };

  const handleSave = () => {
    if (editingId === null) return;
    updateShippingRate.mutate({
      id: editingId,
      minDistance: formData.minDistance,
      maxDistance: formData.maxDistance,
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Min Distance (km)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.minDistance}
                            onChange={(e) => setFormData({ ...formData, minDistance: Number(e.target.value) })}
                            placeholder="Minimum distance"
                          />
                          <p className="text-xs text-muted-foreground mt-1">From km</p>
                        </div>
                        <div>
                          <Label>Max Distance (km)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formData.maxDistance}
                            onChange={(e) => setFormData({ ...formData, maxDistance: Number(e.target.value) })}
                            placeholder="Maximum distance"
                          />
                          <p className="text-xs text-muted-foreground mt-1">To km</p>
                        </div>
                        <div>
                          <Label>Shipping Cost (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.baseCost}
                            onChange={(e) => setFormData({ ...formData, baseCost: Number(e.target.value) })}
                            placeholder="Shipping charge"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Fixed charge for this range</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Example:</strong> Distance Range: 0-10 km, Shipping Cost: ₹50<br />
                          If customer is 5 km away, they pay ₹50
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
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Distance Range</p>
                          <p className="text-lg font-semibold">{Number(rate.minDistance || 0)} - {Number(rate.maxDistance || 100)} km</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Shipping Cost</p>
                          <p className="text-lg font-semibold">₹{Number(rate.baseCost || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="text-lg font-semibold">{rate.isActive ? '✓ Active' : 'Inactive'}</p>
                        </div>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Example:</strong> If customer is {Math.floor((Number(rate.minDistance) + Number(rate.maxDistance)) / 2)} km away, they pay ₹{Number(rate.baseCost || 0).toFixed(2)}
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
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p><strong className="text-foreground">1. Google Maps Distance Calculation</strong></p>
                  <p className="ml-4">Customer enters their address at checkout. System automatically calculates distance from your warehouse (Udhana, Surat - 394210) using Google Maps.</p>
                </div>
                <div className="space-y-2">
                  <p><strong className="text-foreground">2. Automatic Shipping Cost</strong></p>
                  <p className="ml-4">Formula: Base Cost + (Distance × Cost Per Km)</p>
                  <p className="ml-4 text-xs">Example: ₹{Number(shippingRates?.[0]?.baseCost || 0).toFixed(2)} + (10 km × ₹{Number(shippingRates?.[0]?.costPerKm || 5).toFixed(2)}) = ₹{shippingRates?.[0]?.baseCost && shippingRates[0]?.costPerKm ? (Number(shippingRates[0].baseCost) + (10 * Number(shippingRates[0].costPerKm))).toFixed(2) : '100'}</p>
                </div>
                <div className="space-y-2">
                  <p><strong className="text-foreground">3. Edit Charges Anytime</strong></p>
                  <p className="ml-4">Click "Edit Shipping Rates" button above to update Base Cost and Cost Per Km. Changes apply to all new orders immediately.</p>
                </div>
                <div className="space-y-2">
                  <p><strong className="text-foreground">4. Transparent Pricing</strong></p>
                  <p className="ml-4">Customers see exact shipping cost before placing order. No hidden charges.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
