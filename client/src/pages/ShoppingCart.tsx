import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, Trash2, Plus, Minus, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ShoppingCart() {
  const [, setLocation] = useLocation();
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  // Fetch cart items
  const { data: cartItems, isLoading, refetch } = trpc.cart.list.useQuery();

  // Mutations
  const removeFromCartMutation = trpc.cart.remove.useMutation({
    onSuccess: () => refetch(),
  });

  const clearCartMutation = trpc.cart.clear.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  const cartItemsList = cartItems || [];

  // Calculate totals
  let subtotal = 0;
  let gstAmount = 0;
  cartItemsList.forEach((item) => {
    if (item.product) {
      const itemTotal = Number(item.product.basePrice) * item.quantity;
      subtotal += itemTotal;
    }
  });
  gstAmount = subtotal * 0.18;
  const shippingCost = 100;
  const total = subtotal + gstAmount + shippingCost;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/products")} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
        </div>
      </div>

      <div className="container py-8">
        {cartItemsList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">Your cart is empty</p>
            <Button onClick={() => setLocation("/products")}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-4">
              {cartItemsList.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.product?.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-xs text-muted-foreground text-center px-2">
                            {item.product?.partNumber}
                          </span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{item.product?.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Part #: {item.product?.partNumber}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCartMutation.mutate(item.id)}
                            disabled={removeFromCartMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled>
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              readOnly
                              className="w-16 text-center"
                            />
                            <Button variant="outline" size="sm" disabled>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              ₹{Number(item.product?.basePrice).toFixed(2)} each
                            </p>
                            <p className="text-lg font-bold">
                              ₹{(Number(item.product?.basePrice) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Bulk Actions */}
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Bulk Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    Request Quotation
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => clearCartMutation.mutate()}>
                    Clear Cart
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span>₹{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>₹{shippingCost.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center text-lg font-bold mb-4">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>

                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Prices include GST. Tiered discounts apply at checkout.
                      </AlertDescription>
                    </Alert>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setLocation("/checkout")}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                    <p>✓ Free shipping on orders over ₹5000</p>
                    <p>✓ 18% GST included</p>
                    <p>✓ Secure payment</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
