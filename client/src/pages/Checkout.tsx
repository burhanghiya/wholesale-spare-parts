import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, CreditCard, Banknote, Smartphone, Wallet } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [shippingAddress, setShippingAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank_transfer" | "card" | "cod" | "razorpay">("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: cartItems } = trpc.cart.list.useQuery();

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Order placed! #${data.orderNumber}`);
      setLocation("/profile");
    },
    onError: (error) => {
      toast.error(error.message);
      setIsProcessing(false);
    },
  });

  let subtotal = 0;
  cartItems?.forEach((item) => {
    if (item.product) subtotal += Number(item.product.basePrice) * item.quantity;
  });
  const gstAmount = subtotal * 0.18;
  const shippingCost = subtotal >= 5000 ? 0 : 100;
  const total = subtotal + gstAmount + shippingCost;

  const handleSubmitOrder = async () => {
    if (!shippingAddress.trim()) {
      toast.error("Please enter shipping address");
      return;
    }
    setIsProcessing(true);
    createOrderMutation.mutate({ shippingAddress, paymentMethod });
  };

  const paymentOptions = [
    { value: "razorpay", label: "Razorpay (Cards, UPI, Wallets)", desc: "Pay securely via Razorpay gateway", icon: CreditCard },
    { value: "upi", label: "Direct UPI", desc: "Pay directly via UPI ID", icon: Smartphone },
    { value: "bank_transfer", label: "Bank Transfer / NEFT / RTGS", desc: "Transfer to our bank account", icon: Banknote },
    { value: "cod", label: "Cash on Delivery", desc: "Pay when you receive the order", icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="bg-[oklch(0.22_0.05_260)] py-10">
        <div className="container">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white mb-2" onClick={() => setLocation("/cart")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cart
          </Button>
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
        </div>
      </div>

      <div className="container py-8 flex-1">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Full Delivery Address *</Label>
                  <textarea
                    id="address"
                    placeholder="Enter complete address with pincode..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground mt-2 min-h-24 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="gst">GST Number (Optional - for GST invoice)</Label>
                  <Input
                    id="gst"
                    placeholder="e.g., 24AABCU9603R1ZM"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="space-y-3">
                    {paymentOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                          paymentMethod === option.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <option.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* GST Invoice Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                GST invoice will be automatically generated and emailed after order confirmation. 18% GST is included in the total.
              </AlertDescription>
            </Alert>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                  {cartItems?.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-medium truncate text-xs">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <span className="font-medium flex-shrink-0">₹{(Number(item.product?.basePrice) * item.quantity).toFixed(0)}</span>
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
                    <span>{shippingCost === 0 ? "FREE" : `₹${shippingCost.toFixed(2)}`}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  disabled={!shippingAddress.trim() || isProcessing || createOrderMutation.isPending}
                  onClick={handleSubmitOrder}
                >
                  {isProcessing || createOrderMutation.isPending ? "Processing..." : `Place Order - ₹${total.toFixed(0)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
