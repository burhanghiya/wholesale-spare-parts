import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AdminNav } from "./AdminDashboard";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrders() {
  const { user, isAuthenticated } = useAuth();
  const [manualChargeInput, setManualChargeInput] = useState<Record<number, string>>({});
  
  const { data: orders, isLoading, refetch } = trpc.orders.getAllOrders.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  
  const updateMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { toast.success("Order status updated"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const setManualChargeMutation = trpc.admin.setManualShippingCharge.useMutation({
    onSuccess: () => { toast.success("Shipping charge updated"); setManualChargeInput({}); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav current="/admin/orders" />
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-2">Orders</h1>
        <p className="text-muted-foreground mb-6">{orders?.length || 0} total orders</p>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>)}</div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">Orders will appear here when customers place them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold font-mono">{order.orderNumber}</h3>
                        <Badge className={statusColors[order.orderStatus] || "bg-gray-100 text-gray-800"}>
                          {order.orderStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Customer</p>
                          <p className="text-sm">{order.userName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Shipping Address</p>
                          <p className="text-xs whitespace-pre-wrap text-muted-foreground">{order.shippingAddress || "N/A"}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Payment: {order.paymentMethod} | {order.paymentStatus}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{Number(order.totalAmount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Shipping: ₹{Number(order.shippingCost || 0).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Select
                        value={order.orderStatus}
                        onValueChange={(val) => updateMutation.mutate({ orderId: order.id, status: val as any })}
                      >
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Manual shipping"
                          value={manualChargeInput[order.id] || ""}
                          onChange={(e) => setManualChargeInput({ ...manualChargeInput, [order.id]: e.target.value })}
                          className="w-32 h-9"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const charge = parseFloat(manualChargeInput[order.id] || "0");
                            if (charge >= 0) {
                              setManualChargeMutation.mutate({ orderId: order.id, shippingCharge: charge });
                            } else {
                              toast.error("Enter valid shipping charge");
                            }
                          }}
                          disabled={setManualChargeMutation.isPending}
                        >
                          Set
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
