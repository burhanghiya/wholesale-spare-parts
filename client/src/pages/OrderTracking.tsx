import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Package, Truck, CheckCircle } from "lucide-react";

export default function OrderTracking() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Order Tracking</h1>
        </div>
      </div>

      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Order #ORD-1234567890</CardTitle>
            <CardDescription>Placed on March 12, 2026</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Order Confirmed</p>
                  <p className="text-sm text-muted-foreground">March 12, 2026 - 2:30 PM</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">Processing</p>
                  <p className="text-sm text-muted-foreground">March 12, 2026 - 3:00 PM</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Shipped</p>
                  <p className="text-sm text-muted-foreground">Expected March 14, 2026</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold mb-3">Tracking Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking Number:</span>
                  <span className="font-mono">TRK123456789</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carrier:</span>
                  <span>Local Transport</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Delivery:</span>
                  <span>March 14, 2026</span>
                </div>
              </div>
            </div>

            <Button className="w-full">Contact Support on WhatsApp</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
