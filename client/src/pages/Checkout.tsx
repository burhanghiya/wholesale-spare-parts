import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Package, ShoppingBag, Loader2, Check, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: cartItems } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod"); // Always COD
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMockPaymentDialog, setShowMockPaymentDialog] = useState(false);
  const [mockPaymentPending, setMockPaymentPending] = useState<{ orderId: number; razorpayOrderId: string; amount: number } | null>(null);

  // Address
  const [address, setAddress] = useState({
    fullName: "", phone: "", addressLine1: "", addressLine2: "",
    city: "Surat", state: "Gujarat", pincode: "",
  });

  const createOrder = trpc.orders.create.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const verifyPayment = trpc.orders.verifyRazorpayPayment.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const createRazorpayOrder = trpc.orders.createRazorpayOrder.useMutation({
    onError: (err) => toast.error(err.message),
  });

  const clearCart = trpc.cart.clear.useMutation();

  // Get COD setting from admin
  const { data: settings } = trpc.system.getSettings.useQuery();
  const codEnabled = settings?.codEnabled ?? false;

  // COD is the only payment method available

  // Get shipping configuration
  const { data: shippingConfig } = trpc.admin.getShippingConfig.useQuery();
  const freeShippingThreshold = shippingConfig?.freeShippingThreshold || 1000;

  // Calculate shipping based on distance from warehouse
  const fullAddress = `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city}, ${address.state} - ${address.pincode}`;
  const { data: shippingData } = trpc.admin.calculateShippingByDistance.useQuery(
    { address: fullAddress },
    { enabled: fullAddress.length > 10 && address.pincode.length === 6 }
  );
  // Only calculate shipping if address is filled
  const isAddressFilled = address.fullName && address.phone && address.addressLine1 && address.pincode;
  const calculatedShipping = isAddressFilled ? (shippingData?.shippingCost || 45) : 0;

  // Totals
  const subtotal = cartItems?.reduce((sum, item) => sum + Number(item.product?.basePrice || 0) * item.quantity, 0) || 0;
  // Apply free shipping if subtotal >= threshold
  const shippingCost = isAddressFilled && subtotal >= freeShippingThreshold ? 0 : calculatedShipping;
  const total = subtotal + shippingCost;

  const handleMockPaymentConfirm = async () => {
    if (!mockPaymentPending) return;
    
    try {
      await verifyPayment.mutateAsync({
        orderId: mockPaymentPending.orderId,
        razorpayOrderId: mockPaymentPending.razorpayOrderId,
        razorpayPaymentId: `mock_payment_${Date.now()}`,
        razorpaySignature: "mock_signature",
      });

      // Clear cart
      await clearCart.mutateAsync();

      setShowMockPaymentDialog(false);
      setMockPaymentPending(null);
      toast.success("Payment successful! Order confirmed.");
      
      // Redirect to My Orders
      setTimeout(() => {
        setLocation("/profile");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Payment verification failed");
      setShowMockPaymentDialog(false);
      setMockPaymentPending(null);
    }
  };

  const handleMockPaymentCancel = () => {
    setShowMockPaymentDialog(false);
    setMockPaymentPending(null);
    toast.error("Payment cancelled");
  };

  const handlePlaceOrder = async () => {
    // Validate Surat-only delivery
    if (address.city !== "Surat") {
      toast.error("We only deliver in Surat. Please select Surat as your city.");
      return;
    }
    
    if (!address.fullName || !address.phone || !address.addressLine1 || !address.pincode) {
      toast.error("Please fill all address fields!");
      return;
    }

    setIsProcessing(true);

    try {
      const shippingAddressFormatted = `${address.fullName}, ${address.phone}\n${address.addressLine1}${address.addressLine2 ? ", " + address.addressLine2 : ""}\n${address.city}, ${address.state} - ${address.pincode}`;

      if (paymentMethod === "cod") {
        // COD - Create order directly
        const result = await createOrder.mutateAsync({
          shippingAddress: shippingAddressFormatted,
          paymentMethod: paymentMethod,
          shippingPincode: address.pincode,
          shippingCost: calculatedShipping,
          cartItems: cartItems || [],
          totalAmount: total,
        });

        // Clear cart
        await clearCart.mutateAsync();
        
        setOrderPlaced(true);
        setOrderNumber(result.orderNumber);
        toast.success("Order placed successfully!");
        setTimeout(() => {
          setLocation("/profile");
        }, 2000);
      } else if (paymentMethod === "razorpay") {
        // Razorpay - Create order first, then open popup
        // Step 1: Create order in database
        const orderResult = await createOrder.mutateAsync({
          shippingAddress: shippingAddressFormatted,
          paymentMethod: paymentMethod,
          shippingPincode: address.pincode,
          shippingCost: calculatedShipping,
          cartItems: cartItems || [],
          totalAmount: total,
        });

        // Step 2: Create Razorpay order
        const razorpayOrderResult = await createRazorpayOrder.mutateAsync({
          amount: total,
          orderId: orderResult.orderId || 0,
        });

        // Step 3: Check if we should use mock payment (development) or real Razorpay
        const isDevelopment = import.meta.env.DEV || !window.Razorpay;
        
        if (isDevelopment) {
          // Development mode: Show mock payment dialog
          setMockPaymentPending({
            orderId: orderResult.orderId || 0,
            razorpayOrderId: razorpayOrderResult.razorpayOrderId,
            amount: total,
          });
          setShowMockPaymentDialog(true);
          setIsProcessing(false);
        } else {
          // Production mode: Use real Razorpay
          const options = {
            key: "rzp_live_SSPEidW3JH1fgj", // Live key
            amount: Math.round(total * 100), // Convert to paise
            currency: "INR",
            name: "Patel Electricals",
            description: "Order Payment",
            order_id: razorpayOrderResult.razorpayOrderId, // IMPORTANT: Razorpay order ID
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
              contact: address.phone || "",
            },
            handler: async (response: any) => {
              try {
                // Verify payment signature
                await verifyPayment.mutateAsync({
                  orderId: orderResult.orderId || 0,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });

                // Clear cart
                await clearCart.mutateAsync();

                toast.success("Payment successful! Order confirmed.");
                
                // Redirect to My Orders
                setTimeout(() => {
                  setLocation("/profile");
                }, 1500);
              } catch (error: any) {
                toast.error(error.message || "Payment verification failed");
                setIsProcessing(false);
              }
            },
            modal: {
              ondismiss: () => {
                toast.error("Payment cancelled");
                setIsProcessing(false);
              },
            },
            theme: {
              color: "#3b82f6",
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center"><Navbar />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Login Required</h2>
          <p className="text-muted-foreground mb-6">Please login to proceed with checkout</p>
          <a href={getLoginUrl()}><Button>Login Now</Button></a>
        </div>
        <Footer />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">Add products to checkout</p>
          <Button onClick={() => setLocation("/products")}>Continue Shopping</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
          <p className="text-muted-foreground mb-2">Order Number: <span className="font-mono font-bold text-foreground">{orderNumber}</span></p>
          <p className="text-muted-foreground mb-6">Your order has been created. You will be redirected to your orders shortly.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/profile")}>View My Orders</Button>
            <Button variant="outline" onClick={() => setLocation("/products")}>Continue Shopping</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col"><Navbar />
      <div className="bg-[oklch(0.22_0.05_260)] py-8">
        <div className="container">
          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white mb-2" onClick={() => setLocation("/cart")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cart
          </Button>
          <h1 className="text-2xl font-bold text-white">Checkout</h1>
        </div>
      </div>

      <div className="container py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Address Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Delivery Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input placeholder="Your name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Input placeholder="10-digit phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Address Line 1 *</Label>
                  <Input placeholder="Street address" value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} />
                </div>
                <div>
                  <Label>Address Line 2 (Optional)</Label>
                  <Input placeholder="Apartment, suite, etc." value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input placeholder="City" value={address.city} disabled className="bg-muted cursor-not-allowed" />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input placeholder="State" value={address.state} disabled className="bg-muted cursor-not-allowed" />
                  </div>
                  <div>
                    <Label>Pincode *</Label>
                    <Input placeholder="6-digit pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <div className="font-semibold">💵 Cash on Delivery</div>
                  <div className="text-sm text-muted-foreground mt-1">Pay when you receive your order</div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Order Items ({cartItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{item.product?.name}</div>
                      <div className="text-sm text-muted-foreground">Qty: {item.quantity} x ₹{Number(item.product?.basePrice || 0).toLocaleString()}</div>
                    </div>
                    <div className="font-semibold">₹{(Number(item.product?.basePrice || 0) * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button 
              onClick={handlePlaceOrder} 
              disabled={isProcessing}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Place Order - ₹${Math.round(total).toLocaleString()}`
              )}
            </Button>
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items ({cartItems.length})</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="space-y-2 border-t pt-3">
                  {isAddressFilled ? (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      {shippingCost === 0 && subtotal >= freeShippingThreshold ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          FREE DELIVERY
                        </Badge>
                      ) : (
                        <span>₹{Math.round(shippingCost).toLocaleString()}</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Shipping</span>
                      <span className="text-xs">Fill address to calculate</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{Math.round(total).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mock Payment Dialog */}
      <Dialog open={showMockPaymentDialog} onOpenChange={setShowMockPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mock Payment</DialogTitle>
            <DialogDescription>
              This is a development mode payment dialog. Click "Confirm" to simulate a successful payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Order Amount</div>
              <div className="text-2xl font-bold">₹{mockPaymentPending?.amount.toLocaleString()}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-900 dark:text-blue-200">
              <strong>Development Mode:</strong> This dialog simulates a successful payment. In production, the real Razorpay payment gateway will be used.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleMockPaymentCancel}>
              Cancel Payment
            </Button>
            <Button onClick={handleMockPaymentConfirm}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
