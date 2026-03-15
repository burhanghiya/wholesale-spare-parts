import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AdminNav } from "./AdminDashboard";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminPinCodeZones() {
  const { user, isAuthenticated } = useAuth();
  const [newZone, setNewZone] = useState({
    pinCodeStart: "",
    pinCodeEnd: "",
    zone: "",
    shippingCost: "",
  });

  const { data: zones, isLoading, refetch } = trpc.admin.getPinCodeZones.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const upsertMutation = trpc.admin.upsertPinCodeZone.useMutation({
    onSuccess: () => {
      toast.success("PIN code zone saved");
      setNewZone({ pinCodeStart: "", pinCodeEnd: "", zone: "", shippingCost: "" });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.admin.deletePinCodeZone.useMutation({
    onSuccess: () => {
      toast.success("PIN code zone deleted");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated || user?.role !== "admin") return null;

  const handleAddZone = () => {
    if (!newZone.pinCodeStart || !newZone.pinCodeEnd || !newZone.zone || !newZone.shippingCost) {
      toast.error("Please fill all fields");
      return;
    }
    upsertMutation.mutate({
      pinCodeStart: newZone.pinCodeStart,
      pinCodeEnd: newZone.pinCodeEnd,
      zone: newZone.zone,
      shippingCost: Number(newZone.shippingCost),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav current="/admin/pincode-zones" />
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-2">PIN Code Shipping Zones</h1>
        <p className="text-muted-foreground mb-6">Manage shipping costs for different PIN code ranges</p>

        {/* Add New Zone */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Add New PIN Code Zone</h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <Input
                placeholder="PIN Start (e.g., 394210)"
                value={newZone.pinCodeStart}
                onChange={(e) => setNewZone({ ...newZone, pinCodeStart: e.target.value })}
              />
              <Input
                placeholder="PIN End (e.g., 394219)"
                value={newZone.pinCodeEnd}
                onChange={(e) => setNewZone({ ...newZone, pinCodeEnd: e.target.value })}
              />
              <Input
                placeholder="Zone Name (e.g., Udhana)"
                value={newZone.zone}
                onChange={(e) => setNewZone({ ...newZone, zone: e.target.value })}
              />
              <Input
                placeholder="Shipping Cost (₹)"
                type="number"
                value={newZone.shippingCost}
                onChange={(e) => setNewZone({ ...newZone, shippingCost: e.target.value })}
              />
              <Button onClick={handleAddZone} disabled={upsertMutation.isPending} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Zones */}
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Existing PIN Code Zones ({zones?.length || 0})</h2>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : !zones || zones.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No PIN code zones added yet</p>
            ) : (
              <div className="space-y-2">
                {zones.map((zone: any) => (
                  <div key={zone.id} className="flex items-center justify-between p-3 bg-muted rounded">
                    <div className="flex-1">
                      <p className="font-medium">
                        {zone.zone}: {zone.pinCodeStart} - {zone.pinCodeEnd}
                      </p>
                      <p className="text-sm text-muted-foreground">Shipping: ₹{Number(zone.shippingCost).toFixed(2)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this PIN code zone?")) {
                          deleteMutation.mutate(zone.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">How Hybrid Shipping Works</h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Customer enters their PIN code during checkout</li>
              <li>System checks if PIN code falls within any defined zone</li>
              <li>If match found → Use zone's shipping cost (fast, accurate)</li>
              <li>If no match → Use Google Maps distance calculation (fallback)</li>
              <li>This ensures accurate shipping for all locations</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
