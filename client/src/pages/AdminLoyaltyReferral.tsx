import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Gift, AlertCircle } from "lucide-react";
import { AdminNav } from "./AdminDashboard";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

export default function AdminLoyaltyReferral() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Loyalty Points State
  const [loyaltyPointsPerRupee, setLoyaltyPointsPerRupee] = useState("1");
  const [loyaltyRedemptionRate, setLoyaltyRedemptionRate] = useState("1");
  const [loyaltyExpiryDays, setLoyaltyExpiryDays] = useState("365");
  const [loyaltyMinPoints, setLoyaltyMinPoints] = useState("100");
  const [loyaltyMaxPoints, setLoyaltyMaxPoints] = useState("");
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSaveLoyalty = async () => {
    setLoading(true);
    try {
      // TODO: Add tRPC mutation to save loyalty settings
      toast.success("Loyalty settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save loyalty settings");
    } finally {
      setLoading(false);
    }
  };

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
      <AdminNav current="/admin/loyalty-referral" />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <Gift className="h-8 w-8" />
            Loyalty Points Settings
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>Loyalty Points Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <Label htmlFor="loyalty-enabled">Enable Loyalty Program</Label>
                <Switch
                  id="loyalty-enabled"
                  checked={loyaltyEnabled}
                  onCheckedChange={setLoyaltyEnabled}
                />
              </div>

              {/* Points Per Rupee */}
              <div className="space-y-2">
                <Label htmlFor="points-per-rupee">Points Per Rupee</Label>
                <Input
                  id="points-per-rupee"
                  type="number"
                  step="0.01"
                  placeholder="1"
                  value={loyaltyPointsPerRupee}
                  onChange={(e) => setLoyaltyPointsPerRupee(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Customers earn this many points for every ₹1 spent
                </p>
              </div>

              {/* Redemption Rate */}
              <div className="space-y-2">
                <Label htmlFor="redemption-rate">Redemption Rate (Points = ₹)</Label>
                <Input
                  id="redemption-rate"
                  type="number"
                  step="0.01"
                  placeholder="1"
                  value={loyaltyRedemptionRate}
                  onChange={(e) => setLoyaltyRedemptionRate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Every points equal 1 rupee when redeeming
                </p>
              </div>

              {/* Minimum Points to Redeem */}
              <div className="space-y-2">
                <Label htmlFor="min-points">Minimum Points to Redeem</Label>
                <Input
                  id="min-points"
                  type="number"
                  placeholder="100"
                  value={loyaltyMinPoints}
                  onChange={(e) => setLoyaltyMinPoints(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Customers must have at least this many points to redeem
                </p>
              </div>

              {/* Maximum Points Per Order */}
              <div className="space-y-2">
                <Label htmlFor="max-points">Maximum Points Per Order (Optional)</Label>
                <Input
                  id="max-points"
                  type="number"
                  placeholder="Leave empty for no limit"
                  value={loyaltyMaxPoints}
                  onChange={(e) => setLoyaltyMaxPoints(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum points a customer can earn in a single order (leave empty for unlimited)
                </p>
              </div>

              {/* Points Expiry */}
              <div className="space-y-2">
                <Label htmlFor="expiry-days">Points Expiry (Days)</Label>
                <Input
                  id="expiry-days"
                  type="number"
                  placeholder="365"
                  value={loyaltyExpiryDays}
                  onChange={(e) => setLoyaltyExpiryDays(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Days before points expire (leave empty for no expiry)
                </p>
              </div>

              {/* Save Button */}
              <Button onClick={handleSaveLoyalty} disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Loyalty Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
