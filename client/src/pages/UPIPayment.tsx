import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

export default function UPIPayment() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const upiId = "8780657095@okbizaxis";
  const amount = new URLSearchParams(window.location.search).get("amount") || "0";
  const orderId = parseInt(new URLSearchParams(window.location.search).get("orderId") || "0");
  
  // Auto-redirect to Home after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocation("/");
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [setLocation]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUPI = () => {
    const upiLink = `upi://pay?pa=${upiId}&pn=PatelElectricals&am=${amount}&tn=Order%20Payment`;
    window.location.href = upiLink;
  };



  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 container py-8">
        <div className="max-w-md mx-auto">
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Smartphone className="w-8 h-8 text-amber-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-amber-900">
                Complete Payment
              </CardTitle>
              <p className="text-sm text-amber-700 mt-2">
                Scan QR code or use UPI ID below
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Amount */}
              <div className="text-center">
                <p className="text-sm text-amber-700 mb-1">Amount to Pay</p>
                <p className="text-4xl font-bold text-amber-900">
                  ₹{Number(amount).toLocaleString()}
                </p>
              </div>

              {/* UPI ID Section */}
              <div className="bg-white p-4 rounded-lg border-2 border-amber-300">
                <p className="text-xs text-amber-700 font-semibold mb-3 text-center">
                  UPI ID
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={upiId}
                    readOnly
                    className="flex-1 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-sm font-mono text-amber-900"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyUPI}
                    className="border-amber-300 hover:bg-amber-100"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-900 font-semibold mb-2">
                  How to Pay:
                </p>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Open Google Pay or Paytm</li>
                  <li>Select "Send Money"</li>
                  <li>Enter UPI ID: <span className="font-mono font-bold">{upiId}</span></li>
                  <li>Enter amount: <span className="font-bold">₹{Number(amount).toLocaleString()}</span></li>
                  <li>Complete payment</li>
                </ol>
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleOpenUPI}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2"
                >
                  Open UPI App
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setLocation("/cart")}
                  className="w-full"
                >
                  Back to Cart
                </Button>
              </div>
              

              {/* Support */}
              <div className="text-center pt-4 border-t border-amber-200">
                <p className="text-xs text-amber-700 mb-2">
                  Need help? Contact us
                </p>
                <p className="text-sm font-semibold text-amber-900">
                  📞 8780657095
                </p>
                <p className="text-sm text-amber-800">
                  💬 WhatsApp Support Available
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
