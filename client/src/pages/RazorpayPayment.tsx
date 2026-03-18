import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment() {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();
  
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  // Parse URL parameters
  useEffect(() => {
    console.log('[DEBUG RazorpayPayment] location:', location);
    console.log('[DEBUG RazorpayPayment] location.split:', location.split('?'));
    const queryString = location.split('?')[1];
    console.log('[DEBUG RazorpayPayment] queryString:', queryString);
    const params = new URLSearchParams(queryString);
    const id = params.get("orderId");
    const num = params.get("orderNumber");
    const amt = params.get("amount");

    console.log('[DEBUG RazorpayPayment] parsed - id:', id, 'num:', num, 'amt:', amt);

    if (id && num && amt) {
      setOrderId(parseInt(id));
      setOrderNumber(num);
      setAmount(parseFloat(amt));
      console.log('[DEBUG RazorpayPayment] state updated - orderId:', parseInt(id), 'amount:', parseFloat(amt));
    }
  }, [location]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const createRazorpayOrder = trpc.orders.createRazorpayOrder.useMutation();
  const verifyPayment = trpc.orders.verifyRazorpayPayment.useMutation();

  const handlePayment = async () => {
    if (!orderId || !amount) {
      toast.error("Invalid order details");
      return;
    }

    setPaymentProcessing(true);
    setPaymentStatus("processing");

    try {
      // Create Razorpay order on backend
      const razorpayOrderResponse = await createRazorpayOrder.mutateAsync({
        orderId,
        amount: amount * 100, // Convert to paise
      });

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      // Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: razorpayOrderResponse.razorpayOrderId,
        amount: razorpayOrderResponse.amount,
        currency: razorpayOrderResponse.currency,
        name: "Patel Electricals",
        description: `Order #${orderNumber}`,
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            await verifyPayment.mutateAsync({
              orderId,
              razorpayOrderId: razorpayOrderResponse.razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            setPaymentStatus("success");
            toast.success("Payment successful! Order confirmed.");

            // Redirect to home after 3 seconds
            setTimeout(() => {
              setLocation("/");
            }, 3000);
          } catch (error: any) {
            setPaymentStatus("error");
            toast.error(error.message || "Payment verification failed");
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#3b82f6",
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus("idle");
            setPaymentProcessing(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      setPaymentStatus("error");
      toast.error(error.message || "Failed to initiate payment");
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container py-20 text-center flex-1">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please login to complete payment</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="bg-[oklch(0.22_0.05_260)] py-8">
        <div className="container">
          <h1 className="text-2xl font-bold text-white">Razorpay Payment</h1>
        </div>
      </div>

      <div className="container py-12 flex-1">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Details */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-mono font-bold">{orderNumber}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3">
                  <span>Amount to Pay</span>
                  <span className="text-green-600">₹{Math.round(amount).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Messages */}
              {paymentStatus === "success" && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-200">Payment Successful!</p>
                    <p className="text-sm text-green-800 dark:text-green-300">Redirecting to home...</p>
                  </div>
                </div>
              )}

              {paymentStatus === "error" && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-200">Payment Failed</p>
                    <p className="text-sm text-red-800 dark:text-red-300">Please try again or contact support</p>
                  </div>
                </div>
              )}

              {paymentStatus === "processing" && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-200">Processing Payment</p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">Please wait...</p>
                  </div>
                </div>
              )}

              {/* Payment Instructions */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Payment Methods Accepted:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Credit/Debit Cards</li>
                  <li>UPI (Google Pay, Paytm, PhonePe)</li>
                  <li>Digital Wallets</li>
                  <li>Net Banking</li>
                </ul>
              </div>

              {/* Payment Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={paymentProcessing || paymentStatus === "success"}
              >
                {paymentProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : paymentStatus === "success" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Payment Successful
                  </>
                ) : (
                  <>
                    Pay ₹{amount.toLocaleString()}
                  </>
                )}
              </Button>

              {/* Cancel Button */}
              {paymentStatus !== "success" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/checkout")}
                  disabled={paymentProcessing}
                >
                  Cancel Payment
                </Button>
              )}

              {/* Security Notice */}
              <p className="text-xs text-muted-foreground text-center">
                Your payment is secure and encrypted. Razorpay is PCI DSS compliant.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
