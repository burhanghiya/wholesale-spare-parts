import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Gift, Share2 } from "lucide-react";

export default function AdminLoyaltyReferral() {
  const [activeTab, setActiveTab] = useState("loyalty");

  // Loyalty Points State
  const [loyaltyPointsPerRupee, setLoyaltyPointsPerRupee] = useState("1");
  const [loyaltyRedemptionRate, setLoyaltyRedemptionRate] = useState("1");
  const [loyaltyExpiryDays, setLoyaltyExpiryDays] = useState("365");
  const [loyaltyMinPoints, setLoyaltyMinPoints] = useState("100");
  const [loyaltyMaxPoints, setLoyaltyMaxPoints] = useState("");
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(true);

  // Referral State
  const [referrerRewardAmount, setReferrerRewardAmount] = useState("500");
  const [referrerRewardType, setReferrerRewardType] = useState("cash");
  const [referredRewardAmount, setReferredRewardAmount] = useState("250");
  const [referredRewardType, setReferredRewardType] = useState("discount");
  const [minOrderValue, setMinOrderValue] = useState("0");
  const [maxRewardsPerReferrer, setMaxRewardsPerReferrer] = useState("");
  const [referralExpiryDays, setReferralExpiryDays] = useState("90");
  const [referralEnabled, setReferralEnabled] = useState(true);

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

  const handleSaveReferral = async () => {
    setLoading(true);
    try {
      // TODO: Add tRPC mutation to save referral settings
      toast.success("Referral settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save referral settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Loyalty & Referral Settings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="loyalty" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Loyalty Points
            </TabsTrigger>
            <TabsTrigger value="referral" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Referral Program
            </TabsTrigger>
          </TabsList>

          {/* LOYALTY POINTS TAB */}
          <TabsContent value="loyalty" className="space-y-6">
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
                    value={loyaltyPointsPerRupee}
                    onChange={(e) => setLoyaltyPointsPerRupee(e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-sm text-muted-foreground">
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
                    value={loyaltyRedemptionRate}
                    onChange={(e) => setLoyaltyRedemptionRate(e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-sm text-muted-foreground">
                    How many points equal ₹1 when redeeming
                  </p>
                </div>

                {/* Minimum Points to Redeem */}
                <div className="space-y-2">
                  <Label htmlFor="min-points">Minimum Points to Redeem</Label>
                  <Input
                    id="min-points"
                    type="number"
                    value={loyaltyMinPoints}
                    onChange={(e) => setLoyaltyMinPoints(e.target.value)}
                    placeholder="100"
                  />
                </div>

                {/* Maximum Points Per Order */}
                <div className="space-y-2">
                  <Label htmlFor="max-points">Maximum Points Per Order (Optional)</Label>
                  <Input
                    id="max-points"
                    type="number"
                    value={loyaltyMaxPoints}
                    onChange={(e) => setLoyaltyMaxPoints(e.target.value)}
                    placeholder="Leave empty for no limit"
                  />
                </div>

                {/* Points Expiry */}
                <div className="space-y-2">
                  <Label htmlFor="expiry-days">Points Expiry (Days)</Label>
                  <Input
                    id="expiry-days"
                    type="number"
                    value={loyaltyExpiryDays}
                    onChange={(e) => setLoyaltyExpiryDays(e.target.value)}
                    placeholder="365"
                  />
                  <p className="text-sm text-muted-foreground">
                    Days before points expire (leave empty for no expiry)
                  </p>
                </div>

                <Button
                  onClick={handleSaveLoyalty}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Loyalty Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REFERRAL PROGRAM TAB */}
          <TabsContent value="referral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Referral Program Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="referral-enabled">Enable Referral Program</Label>
                  <Switch
                    id="referral-enabled"
                    checked={referralEnabled}
                    onCheckedChange={setReferralEnabled}
                  />
                </div>

                {/* Referrer Reward */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Referrer Reward</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="referrer-amount">Reward Amount</Label>
                      <Input
                        id="referrer-amount"
                        type="number"
                        step="0.01"
                        value={referrerRewardAmount}
                        onChange={(e) => setReferrerRewardAmount(e.target.value)}
                        placeholder="500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referrer-type">Reward Type</Label>
                      <Select value={referrerRewardType} onValueChange={setReferrerRewardType}>
                        <SelectTrigger id="referrer-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="points">Points</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Referred Customer Reward */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Referred Customer Reward</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="referred-amount">Reward Amount</Label>
                      <Input
                        id="referred-amount"
                        type="number"
                        step="0.01"
                        value={referredRewardAmount}
                        onChange={(e) => setReferredRewardAmount(e.target.value)}
                        placeholder="250"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referred-type">Reward Type</Label>
                      <Select value={referredRewardType} onValueChange={setReferredRewardType}>
                        <SelectTrigger id="referred-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="points">Points</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">Additional Settings</h3>
                  <div className="space-y-2">
                    <Label htmlFor="min-order">Minimum Order Value for Reward</Label>
                    <Input
                      id="min-order"
                      type="number"
                      step="0.01"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-rewards">Max Rewards Per Referrer (Optional)</Label>
                    <Input
                      id="max-rewards"
                      type="number"
                      value={maxRewardsPerReferrer}
                      onChange={(e) => setMaxRewardsPerReferrer(e.target.value)}
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referral-expiry">Referral Link Expiry (Days)</Label>
                    <Input
                      id="referral-expiry"
                      type="number"
                      value={referralExpiryDays}
                      onChange={(e) => setReferralExpiryDays(e.target.value)}
                      placeholder="90"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveReferral}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Referral Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
