import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Percent } from "lucide-react";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([
    { id: 1, code: "SAVE10", discount: 10, minAmount: 500, active: true },
    { id: 2, code: "BULK20", discount: 20, minAmount: 5000, active: true },
    { id: 3, code: "WELCOME5", discount: 5, minAmount: 0, active: false },
  ]);

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount: 0,
    minAmount: 0,
  });

  const handleAddCoupon = () => {
    if (newCoupon.code && newCoupon.discount > 0) {
      setCoupons([
        ...coupons,
        {
          id: Date.now(),
          ...newCoupon,
          active: true,
        },
      ]);
      setNewCoupon({ code: "", discount: 0, minAmount: 0 });
    }
  };

  const handleDeleteCoupon = (id: number) => {
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  const handleToggleCoupon = (id: number) => {
    setCoupons(
      coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Coupons & Discounts</h1>
        <p className="text-muted-foreground">Create and manage discount codes</p>
      </div>

      {/* Add New Coupon */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Coupon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Coupon Code</label>
              <Input
                value={newCoupon.code}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g., SAVE10"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Discount %</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={newCoupon.discount}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, discount: Number(e.target.value) })
                  }
                  placeholder="10"
                  min="0"
                  max="100"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Min Amount (₹)</label>
              <Input
                type="number"
                value={newCoupon.minAmount}
                onChange={(e) =>
                  setNewCoupon({ ...newCoupon, minAmount: Number(e.target.value) })
                }
                placeholder="500"
                min="0"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddCoupon} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Coupon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center justify-between p-3 bg-muted rounded border"
              >
                <div className="flex items-center gap-4">
                  <div className="font-mono font-bold text-lg">{coupon.code}</div>
                  <div className="text-sm">
                    <p className="font-medium">{coupon.discount}% off</p>
                    <p className="text-muted-foreground">
                      Min: ₹{coupon.minAmount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={coupon.active ? "default" : "secondary"}
                    onClick={() => handleToggleCoupon(coupon.id)}
                    className="cursor-pointer"
                  >
                    {coupon.active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCoupon(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
