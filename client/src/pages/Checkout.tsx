import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [shippingAddress, setShippingAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank_transfer" | "card" | "cod" | "razorpay">("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch cart items for order summary
  const { data: cartItems } = trpc.cart.list.useQuery();

  // Create order mutation
  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      alert(`Order created! Order #: ${data.orderNumber}`);
      setLocation(`/orders/${data.orderNumber}`);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
      setIsProcessing(false);
    },
  });

  // Calculate totals
  let subtotal = 0;
  cartItems?.forEach((item) => {
    if (item.product) {
      subtotal += Number(item.product.basePrice) * item.quantity;
    }
  });
  const gstAmount = subtotal * 0.18;
  const shippingCost = 100;
  const total = subtotal + gstAmount + shippingCost;

  const handleSubmitOrder = async () => {
    if (!shippingAddress.trim()) {
      alert("Please enter shipping address");
      return;
    }

    setIsProcessing(true);

    if (paymentMethod === "razorpay") {
      // Initialize Razorpay
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const options = {
          key: process.env.VITE_RAZORPAY_KEY_ID || "",
          amount: Math.round(total * 100), // Amount in paise
          currency: "INR",
          name: "Patel Electricals",
          description: "Wholesale Spare Parts Order",
          handler: (response: any) => {
            createOrderMutation.mutate({
              shippingAddress,
              paymentMethod: "razorpay",
            });
          },
          prefill: {
            email: "customer@example.com",
            contact: "9999999999",
          },
          theme: {
            color: "#3b82f6",
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } else {
      createOrderMutation.mutate({
        shippingAddress,
        paymentMethod,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/cart")} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Checkout Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Full Address</Label>
                  <textarea
                    id="address"
                    placeholder="Enter your complete shipping address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2 min-h-24"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Razorpay</div>
                        <div className="text-sm text-muted-foreground">Credit/Debit Card, UPI, Wallets</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex-1 cursor-pointer">
                        <div className="font-semibold">UPI</div>
                        <div className="text-sm text-muted-foreground">Direct bank transfer via UPI</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Bank Transfer</div>
                        <div className="text-sm text-muted-foreground">Direct bank account transfer</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted/50">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex-1 cursor-pointer">
                        <div className="font-semibold">Cash on Delivery</div>
                        <div className="text-sm text-muted-foreground">Pay when you receive the order</div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* GST Information */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  GST Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-900">
                  A GST invoice will be automatically generated and sent to your email after order confirmation.
                </p>
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
                <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
                  {cartItems?.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
                      <span className="text-muted-foreground">
                        {item.product?.name} x{item.quantity}
                      </span>
                      <span>₹{(Number(item.product?.basePrice) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2 text-sm">
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
                      Please enter your shipping address to proceed.
                    </AlertDescription>
                  </Alert>

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!shippingAddress.trim() || isProcessing || createOrderMutation.isPending}
                    onClick={handleSubmitOrder}
                  >
                    {isProcessing || createOrderMutation.isPending ? "Processing..." : "Place Order"}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                  <p>✓ Secure payment</p>
                  <p>✓ GST invoice included</p>
                  <p>✓ Order tracking available</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
