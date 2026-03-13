import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AdminNav } from "./AdminDashboard";
import { toast } from "sonner";
import { AlertCircle, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminPinCodeZones() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: zones, isLoading } = trpc.admin.getPinCodeZones.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === 'admin' }
  );

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    pinCodeStart: '',
    pinCodeEnd: '',
    zone: '',
    shippingCost: '',
  });

  const upsertZone = trpc.admin.upsertPinCodeZone.useMutation({
    onSuccess: () => {
      toast.success("PIN code zone saved successfully!");
      resetForm();
      utils.admin.getPinCodeZones.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormData({ pinCodeStart: '', pinCodeEnd: '', zone: '', shippingCost: '' });
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!formData.pinCodeStart || !formData.pinCodeEnd || !formData.zone || !formData.shippingCost) {
      toast.error("Please fill all fields!");
      return;
    }

    if (formData.pinCodeStart.length !== 6 || formData.pinCodeEnd.length !== 6) {
      toast.error("PIN codes must be 6 digits!");
      return;
    }

    if (formData.pinCodeStart > formData.pinCodeEnd) {
      toast.error("Start PIN code must be less than end PIN code!");
      return;
    }

    upsertZone.mutate({
      pinCodeStart: formData.pinCodeStart,
      pinCodeEnd: formData.pinCodeEnd,
      zone: formData.zone,
      shippingCost: Number(formData.shippingCost),
      isActive: true,
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">PIN Code Shipping Zones</h1>
            <p className="text-muted-foreground">Manage shipping charges by PIN code ranges</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Zone
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-base">Add New PIN Code Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start PIN Code *</Label>
                  <Input
                    placeholder="e.g., 390001"
                    value={formData.pinCodeStart}
                    onChange={(e) => setFormData({ ...formData, pinCodeStart: e.target.value })}
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label>End PIN Code *</Label>
                  <Input
                    placeholder="e.g., 390099"
                    value={formData.pinCodeEnd}
                    onChange={(e) => setFormData({ ...formData, pinCodeEnd: e.target.value })}
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Zone Name *</Label>
                  <Input
                    placeholder="e.g., Zone A - Surat"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Shipping Cost (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 50"
                    value={formData.shippingCost}
                    onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={upsertZone.isPending}
                  className="flex-1"
                >
                  {upsertZone.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Zone
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : zones && zones.length > 0 ? (
          <div className="space-y-4">
            {zones.map((zone: any) => (
              <Card key={zone.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">PIN Code Range</p>
                      <p className="font-semibold">{zone.pinCodeStart} - {zone.pinCodeEnd}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Zone</p>
                      <p className="font-semibold">{zone.zone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Shipping Cost</p>
                      <p className="font-semibold">₹{Number(zone.shippingCost).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-semibold">{zone.isActive ? '✓ Active' : '✗ Inactive'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                      <Button variant="destructive" size="sm" className="flex-1">Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground mb-4">No PIN code zones configured yet</p>
              <Button onClick={() => setShowForm(true)}>Add First Zone</Button>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
          <CardHeader>
            <CardTitle className="text-base">How PIN Code Zones Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>1. Define PIN code ranges for different zones (e.g., 390001-390099 for Surat)</p>
            <p>2. Set a fixed shipping cost for each zone</p>
            <p>3. When customers enter their PIN code during checkout, shipping cost auto-calculates</p>
            <p>4. If PIN code doesn't match any zone, shipping cost will be 0</p>
            <p><strong>Example:</strong> PIN 390050 falls in 390001-390099 range → Shipping cost = ₹50</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
