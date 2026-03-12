import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, CreditCard, Banknote, Smartphone, Building2, MapPin, FileText, Truck, Package, ShoppingBag } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

type PaymentMethod = "cod" | "upi" | "bank_transfer" | "razorpay";

export default function Checkout() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { data: cartItems } = trpc.cart.list.useQuery(undefined, { enabled: isAuthenticated });

  const [step, setStep] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Address
  const [address, setAddress] = useState({
    fullName: "", phone: "", addressLine1: "", addressLine2: "",
    city: "", state: "Gujarat", pincode: "",
  });

  // Payment & GST
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [includeGst, setIncludeGst] = useState(true);
  const [gstNumber, setGstNumber] = useState("");

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      setOrderPlaced(true);
      setOrderNumber(data.orderNumber);
    },
    onError: (err) => toast.error(err.message),
  });

  // Totals
  const subtotal = cartItems?.reduce((sum, item) => sum + Number(item.product?.basePrice || 0) * item.quantity, 0) || 0;
  const gstAmount = includeGst ? Math.round(subtotal * 0.18) : 0;
  const shippingCost = subtotal >= 5000 ? 0 : 150;
  const totalAmount = subtotal + gstAmount + shippingCost;

  const handlePlaceOrder = () => {
    if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.pincode) {
      toast.error("Please fill all address fields!"); setStep(1); return;
    }
    const fullAddress = `${address.fullName}, ${address.phone}\n${address.addressLine1}${address.addressLine2 ? ", " + address.addressLine2 : ""}\n${address.city}, ${address.state} - ${address.pincode}`;
    createOrder.mutate({
      shippingAddress: fullAddress,
      paymentMethod,
      includeGst,
      gstNumber: gstNumber || undefined,
      shippingPincode: address.pincode,
    });
  };

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-muted-foreground mb-6">Please login to proceed with checkout.</p>
          <a href={getLoginUrl()}><Button size="lg">Login / Register</Button></a>
        </div><Footer />
      </div>
    );
  }

  // Order success
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background"><Navbar />
        <div className="container py-20 max-w-lg mx-auto text-center">
          <div className="bg-green-50 dark:bg-green-950/30 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Order Submitted!</h1>
          <p className="text-lg text-muted-foreground mb-2">Your order has been submitted for review.</p>
          <p className="text-sm text-muted-foreground mb-6">
            Order Number: <span className="font-mono font-bold text-foreground">{orderNumber}</span>
          </p>
          <Card className="mb-6 text-left">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Order Pending Review</p>
                  <p className="text-xs text-muted-foreground">Admin will review and confirm your order. You will be notified when status changes.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/profile")}>View My Orders</Button>
            <Button variant="outline" onClick={() => setLocation("/products")}>Continue Shopping</Button>
          </div>
        </div><Footer />
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
        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {[{ n: 1, l: "Address", i: MapPin }, { n: 2, l: "Payment", i: CreditCard }, { n: 3, l: "Review", i: FileText }].map((s, idx) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <button onClick={() => setStep(s.n)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full justify-center ${
                step === s.n ? "bg-primary text-primary-foreground" : step > s.n ? "bg-green-100 dark:bg-green-900/30 text-green-700" : "bg-muted text-muted-foreground"
              }`}>
                <s.i className="h-4 w-4" /><span className="hidden sm:inline">{s.l}</span><span className="sm:hidden">{s.n}</span>
              </button>
              {idx < 2 && <div className="w-4 h-px bg-border flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Step 1: Address */}
            {step === 1 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Shipping Address</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Full Name *</Label><Input value={address.fullName} onChange={(e) => setAddress(p => ({ ...p, fullName: e.target.value }))} placeholder="Your full name" className="mt-1" /></div>
                    <div><Label>Phone Number *</Label><Input value={address.phone} onChange={(e) => setAddress(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit mobile number" className="mt-1" /></div>
                  </div>
                  <div><Label>Address Line 1 *</Label><Input value={address.addressLine1} onChange={(e) => setAddress(p => ({ ...p, addressLine1: e.target.value }))} placeholder="House/Shop No., Street, Area" className="mt-1" /></div>
                  <div><Label>Address Line 2</Label><Input value={address.addressLine2} onChange={(e) => setAddress(p => ({ ...p, addressLine2: e.target.value }))} placeholder="Landmark, Near..." className="mt-1" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div><Label>City *</Label><Input value={address.city} onChange={(e) => setAddress(p => ({ ...p, city: e.target.value }))} placeholder="City" className="mt-1" /></div>
                    <div><Label>State</Label><Input value={address.state} onChange={(e) => setAddress(p => ({ ...p, state: e.target.value }))} placeholder="State" className="mt-1" /></div>
                    <div><Label>Pincode *</Label><Input value={address.pincode} onChange={(e) => setAddress(p => ({ ...p, pincode: e.target.value }))} placeholder="394210" className="mt-1" /></div>
                  </div>
                  <Button className="w-full sm:w-auto" onClick={() => {
                    if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.pincode) { toast.error("Please fill all required fields!"); return; }
                    setStep(2);
                  }}>Continue to Payment</Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Method</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {([
                      { id: "cod" as PaymentMethod, label: "Cash on Delivery", desc: "Pay when you receive the order", icon: Banknote },
                      { id: "upi" as PaymentMethod, label: "UPI Payment", desc: "Pay via Google Pay, PhonePe, Paytm", icon: Smartphone },
                      { id: "bank_transfer" as PaymentMethod, label: "Bank Transfer (NEFT/RTGS)", desc: "Direct bank transfer", icon: Building2 },
                      { id: "razorpay" as PaymentMethod, label: "Online Payment (Card/UPI/Netbanking)", desc: "Pay securely via Razorpay", icon: CreditCard },
                    ]).map((m) => (
                      <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-colors text-left ${paymentMethod === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${paymentMethod === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <m.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1"><p className="font-medium">{m.label}</p><p className="text-xs text-muted-foreground">{m.desc}</p></div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === m.id ? "border-primary" : "border-muted-foreground/30"}`}>
                          {paymentMethod === m.id && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> GST Invoice</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium">Include GST (18%)</p><p className="text-xs text-muted-foreground">GST will be added to your order total</p></div>
                      <button onClick={() => setIncludeGst(!includeGst)} className={`relative w-12 h-6 rounded-full transition-colors ${includeGst ? "bg-primary" : "bg-muted"}`}>
                        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${includeGst ? "translate-x-6" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    {includeGst && (
                      <div><Label>GST Number (Optional)</Label><Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="e.g. 24AAAAA0000A1Z5" className="mt-1" /><p className="text-xs text-muted-foreground mt-1">Enter your GSTIN for tax credit</p></div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)}>Review Order</Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Delivery Address</CardTitle><Button variant="ghost" size="sm" onClick={() => setStep(1)}>Edit</Button></div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{address.fullName}</p>
                    <p className="text-sm text-muted-foreground">{address.phone}</p>
                    <p className="text-sm text-muted-foreground">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}</p>
                    <p className="text-sm text-muted-foreground">{address.city}, {address.state} - {address.pincode}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between"><CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment</CardTitle><Button variant="ghost" size="sm" onClick={() => setStep(2)}>Edit</Button></div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium capitalize">{paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "upi" ? "UPI Payment" : paymentMethod === "bank_transfer" ? "Bank Transfer" : "Online Payment (Razorpay)"}</p>
                    {includeGst && <Badge variant="secondary" className="mt-1">GST Invoice{gstNumber ? `: ${gstNumber}` : ""}</Badge>}
                    {!includeGst && <Badge variant="outline" className="mt-1">No GST</Badge>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Order Items ({cartItems?.length || 0})</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {cartItems?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.product?.imageUrl ? <img src={item.product.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{item.product?.name}</p><p className="text-xs text-muted-foreground">Qty: {item.quantity} x ₹{Number(item.product?.basePrice || 0).toLocaleString()}</p></div>
                        <p className="font-semibold text-sm">₹{(Number(item.product?.basePrice || 0) * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={createOrder.isPending}>
                  {createOrder.isPending ? "Placing Order..." : `Confirm & Place Order - ₹${totalAmount.toLocaleString()}`}
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal ({cartItems?.length || 0} items)</span><span>₹{subtotal.toLocaleString()}</span></div>
                {includeGst && <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST (18%)</span><span>₹{gstAmount.toLocaleString()}</span></div>}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Shipping</span>
                  <span className={shippingCost === 0 ? "text-green-600 font-medium" : ""}>{shippingCost === 0 ? "FREE" : `₹${shippingCost}`}</span>
                </div>
                {shippingCost > 0 && <p className="text-xs text-muted-foreground">Free shipping on orders above ₹5,000</p>}
                <Separator />
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{totalAmount.toLocaleString()}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
