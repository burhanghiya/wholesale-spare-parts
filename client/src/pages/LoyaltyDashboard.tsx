import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Gift, Share2, TrendingUp, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function LoyaltyDashboard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("points");

  // Mock data - replace with actual tRPC queries
  const loyaltyData = {
    currentPoints: 2450,
    totalEarned: 5000,
    totalRedeemed: 2550,
    pointsValue: 24.50, // Based on redemption rate
    nextTierAt: 5000,
    tier: "Silver",
  };

  const referralData = {
    referralCode: "BURHAN123",
    referralLink: "https://wholeshop.com/ref/BURHAN123",
    totalReferred: 8,
    totalConverted: 3,
    totalEarnings: 1500,
  };

  const recentTransactions = [
    { id: 1, type: "earned", points: 500, reason: "Order #1350002", date: "2026-03-27", balance: 2450 },
    { id: 2, type: "redeemed", points: -150, reason: "Discount applied", date: "2026-03-25", balance: 1950 },
    { id: 3, type: "earned", points: 1200, reason: "Order #1350001", date: "2026-03-20", balance: 2100 },
  ];

  const referralTransactions = [
    { id: 1, referred: "Raj Patel", status: "completed", amount: 500, type: "cash", date: "2026-03-26" },
    { id: 2, referred: "Priya Singh", status: "pending", amount: 250, type: "discount", date: "2026-03-25" },
    { id: 3, referred: "Amit Kumar", status: "completed", amount: 500, type: "cash", date: "2026-03-20" },
  ];

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralData.referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join Patel Electricals",
        text: `Join Patel Electricals using my referral code and get ₹250 discount! ${referralData.referralLink}`,
      });
    } else {
      handleCopyReferralLink();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-12">
        <h1 className="text-3xl font-bold mb-8">My Rewards</h1>

        {/* Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Current Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loyaltyData.currentPoints}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Worth ₹{loyaltyData.pointsValue.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tier Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{loyaltyData.tier}</Badge>
                <span className="text-sm text-muted-foreground">
                  {loyaltyData.nextTierAt - loyaltyData.totalEarned} points to Gold
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mt-3">
                <div
                  className="bg-primary rounded-full h-2"
                  style={{ width: `${(loyaltyData.totalEarned / loyaltyData.nextTierAt) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{referralData.totalConverted}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Earned ₹{referralData.totalEarnings}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="points">Loyalty Points</TabsTrigger>
            <TabsTrigger value="referral">Referral Program</TabsTrigger>
          </TabsList>

          {/* LOYALTY POINTS TAB */}
          <TabsContent value="points" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How Loyalty Points Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Earn Points
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Earn 1 point for every ₹1 you spend on orders
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Redeem Points</h4>
                    <p className="text-sm text-muted-foreground">
                      Redeem 100 points for ₹100 discount on your next order
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{tx.reason}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${tx.type === "earned" ? "text-green-600" : "text-red-600"}`}>
                          {tx.type === "earned" ? "+" : ""}{tx.points}
                        </p>
                        <p className="text-xs text-muted-foreground">Balance: {tx.balance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REFERRAL PROGRAM TAB */}
          <TabsContent value="referral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Referral Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralData.referralCode}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-muted"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(referralData.referralCode);
                        toast.success("Code copied!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Referral Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralData.referralLink}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyReferralLink}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button onClick={handleShareReferral} className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Referral Link
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{referralData.totalReferred}</p>
                    <p className="text-xs text-muted-foreground">People Referred</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{referralData.totalConverted}</p>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">₹{referralData.totalEarnings}</p>
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referralTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{tx.referred}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={tx.status === "completed" ? "default" : "secondary"}>
                          {tx.status}
                        </Badge>
                        <p className="text-sm font-semibold mt-1">
                          {tx.type === "cash" ? "₹" : ""}{tx.amount}
                          {tx.type === "discount" ? " discount" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
