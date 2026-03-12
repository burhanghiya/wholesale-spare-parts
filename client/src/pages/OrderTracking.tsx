import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, XCircle, Loader2, MessageCircle, ShoppingBag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const statusSteps = [
  { key: "pending", label: "Order Placed", desc: "Waiting for admin review", icon: Clock, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30" },
  { key: "confirmed", label: "Confirmed", desc: "Order has been confirmed", icon: CheckCircle2, color: "bg-green-100 text-green-600 dark:bg-green-900/30" },
  { key: "processing", label: "Processing", desc: "Order is being prepared", icon: Package, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
  { key: "shipped", label: "Shipped", desc: "Order is on the way", icon: Truck, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
  { key: "delivered", label: "Delivered", desc: "Order has been delivered", icon: CheckCircle2, color: "bg-green-100 text-green-600 dark:bg-green-900/30" },
];

function getStatusIndex(status: string) {
  if (status === "cancelled") return -1;
  return statusSteps.findIndex((s) => s.key === status);
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Pending", variant: "secondary" },
    confirmed: { label: "Confirmed", variant: "default" },
    processing: { label: "Processing", variant: "default" },
    shipped: { label: "Shipped", variant: "default" },
    delivered: { label: "Delivered", variant: "default" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  };
  const s = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export default function OrderTracking() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error } = trpc.orders.getById.useQuery(orderId, {
    enabled: isAuthenticated && !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /><p className="mt-4 text-muted-foreground">Loading order details...</p></div>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">This order does not exist or you don't have access.</p>
          <Button onClick={() => setLocation("/profile")}>Go to My Orders</Button>
        </div><Footer />
      </div>
    );
  }

  const { order, items } = data;
  const currentIdx = getStatusIndex(order.orderStatus);
  const isCancelled = order.orderStatus === "cancelled";

  return (
    <div className="min-h-screen bg-background flex flex-col"><Navbar />
      <div className="bg-[oklch(0.22_0.05_260)] py-8">
        <div className="container">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white mb-2" onClick={() => setLocation("/profile")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Orders
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Order #{order.orderNumber}</h1>
            {getStatusBadge(order.orderStatus)}
          </div>
          <p className="text-white/60 text-sm mt-1">Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <div className="container py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline */}
            <Card>
              <CardHeader><CardTitle className="text-base">Order Status</CardTitle></CardHeader>
              <CardContent>
                {isCancelled ? (
                  <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
                      <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {statusSteps.map((step, idx) => {
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={step.key} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isCompleted ? step.color : "bg-muted text-muted-foreground"
                            } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                              <step.icon className="h-5 w-5" />
                            </div>
                            {idx < statusSteps.length - 1 && (
                              <div className={`w-0.5 h-8 ${isCompleted && idx < currentIdx ? "bg-green-400" : "bg-muted"}`} />
                            )}
                          </div>
                          <div className="pb-6">
                            <p className={`font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                            <p className="text-xs text-muted-foreground">{isCurrent ? "Current status" : isCompleted ? "Completed" : step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tracking Details */}
            {order.trackingNumber && (
              <Card>
                <CardHeader><CardTitle className="text-base">Tracking Details</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Tracking Number:</span><span className="font-mono font-medium">{order.trackingNumber}</span></div>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader><CardTitle className="text-base">Order Items ({items.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product?.imageUrl ? <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product?.name || "Product"}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} x ₹{Number(item.unitPrice).toLocaleString()}</p>
                    </div>
                    <p className="font-semibold text-sm">₹{Number(item.totalPrice).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Payment Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>₹{Number(order.totalAmount).toLocaleString()}</span></div>
                {Number(order.gstAmount) > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST (18%)</span><span>₹{Number(order.gstAmount).toLocaleString()}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping</span><span>{Number(order.shippingCost) === 0 ? "FREE" : `₹${Number(order.shippingCost).toLocaleString()}`}</span></div>
                <Separator />
                <div className="flex justify-between font-bold"><span>Total</span><span>₹{(Number(order.totalAmount) + Number(order.gstAmount) + Number(order.shippingCost)).toLocaleString()}</span></div>
                <div className="pt-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span className="capitalize">{order.paymentMethod?.replace("_", " ")}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-muted-foreground">Payment Status</span><Badge variant={order.paymentStatus === "completed" ? "default" : "secondary"} className="text-xs">{order.paymentStatus}</Badge></div>
                </div>
              </CardContent>
            </Card>

            {order.shippingAddress && (
              <Card>
                <CardHeader><CardTitle className="text-base">Shipping Address</CardTitle></CardHeader>
                <CardContent><p className="text-sm whitespace-pre-line">{order.shippingAddress}</p></CardContent>
              </Card>
            )}

            <Button className="w-full" variant="outline" onClick={() => window.open(`https://wa.me/918780657095?text=Hi, I need help with order ${order.orderNumber}`, "_blank")}>
              <MessageCircle className="h-4 w-4 mr-2" /> Contact Support on WhatsApp
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
