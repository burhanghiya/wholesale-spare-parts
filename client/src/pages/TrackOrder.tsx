import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ShoppingCart, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function TrackOrder() {
  const [location] = useLocation();
  const [orderNumber, setOrderNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get("order");
    if (orderParam) {
      setOrderNumber(orderParam);
      setIsSearching(true);
    }
  }, []);

  const { data: order, isLoading, error, refetch } = trpc.orders.getOrderByNumber.useQuery(
    { orderNumber },
    { enabled: orderNumber.length > 0 && isSearching }
  );

  const handleSearch = () => {
    if (!orderNumber.trim()) {
      toast.error("Please enter order number");
      return;
    }
    setIsSearching(true);
    refetch();
  };

  const handleCopyLink = () => {
    const trackingUrl = `${window.location.origin}/track-order?order=${orderNumber}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Tracking link copied!");
  };

  const getStatusIndex = (status: string) => {
    return statusSteps.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-4">
          <h1 className="text-2xl font-bold text-foreground">Track Your Order</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your order number to see the latest status</p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter order number (e.g., ORD-1773569283397)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading} className="sm:w-32">
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-8">
            <CardContent className="p-6">
              <p className="text-red-800 font-medium">Order not found</p>
              <p className="text-red-700 text-sm mt-1">Please check the order number and try again</p>
            </CardContent>
          </Card>
        )}

        {order && (
          <div className="space-y-6">
            {/* Order Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold font-mono">{order.orderNumber}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <Badge className={statusColors[order.orderStatus] || "bg-gray-100 text-gray-800"}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-6">Order Status Timeline</h3>
                <div className="space-y-4">
                  {statusSteps.map((step, idx) => {
                    const currentStatusIdx = getStatusIndex(order.orderStatus);
                    const isCompleted = idx <= currentStatusIdx;
                    const isCurrent = idx === currentStatusIdx;

                    return (
                      <div key={step} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                              isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {isCompleted ? "✓" : idx + 1}
                          </div>
                          {idx < statusSteps.length - 1 && (
                            <div
                              className={`w-0.5 h-12 mt-2 ${
                                isCompleted ? "bg-green-500" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className={`font-medium capitalize ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                            {step === "pending" && "Order Pending"}
                            {step === "confirmed" && "Order Confirmed"}
                            {step === "processing" && "Processing"}
                            {step === "shipped" && "Shipped"}
                            {step === "delivered" && "Delivered"}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-blue-600 mt-1">Current status</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {order.orderStatus === "cancelled" && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                      This order has been cancelled
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Order Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Order Number</p>
                    <p className="text-sm mt-1 font-mono">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Total Amount</p>
                    <p className="text-lg font-bold mt-1">₹{Number(order.totalAmount).toLocaleString()}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Shipping Address</p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{order.shippingAddress || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Items in Order</h3>
                  <div className="space-y-3">
                    {order.items.map((item: any, idx: number) => {
                      const unitPrice = Number(item.basePrice || item.price || 0);
                      const qty = Number(item.quantity || 1);
                      const subtotal = unitPrice * qty;
                      return (
                        <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.productName} className="w-16 h-16 object-cover rounded" />
                          )}
                          <div className="flex-1 text-sm">
                            <div className="font-medium">{item.productName || item.name} {item.partNumber ? `(#${item.partNumber})` : ''}</div>
                            {(item.selectedColor || item.selectedSize) && (
                              <div className="text-muted-foreground text-xs mt-1">
                                {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                                {item.selectedColor && item.selectedSize && <span> | </span>}
                                {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                              </div>
                            )}
                            <div className="flex justify-between mt-2 text-muted-foreground">
                              <span>x{qty} @ ₹{unitPrice.toLocaleString()}</span>
                              <span className="font-semibold text-foreground">₹{subtotal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Shipping Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Shipping Cost</p>
                    <p className="text-lg font-bold mt-1">₹{Number(order.shippingCost || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Payment Method</p>
                    <p className="text-sm mt-1 capitalize">{order.paymentMethod || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Tracking Link */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Share Tracking Link</h3>
                <p className="text-sm text-muted-foreground mb-3">Share this link with others to let them track your order</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/track-order?order=${orderNumber}`}
                    className="text-xs"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!order && !error && !isSearching && (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Track Your Order</h3>
            <p className="text-muted-foreground">Enter your order number above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
