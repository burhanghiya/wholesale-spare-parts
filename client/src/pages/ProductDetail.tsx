import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingCart, AlertCircle, CheckCircle, Package, ArrowLeft, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const WHATSAPP_URL = `https://wa.me/918780657095?text=`;

export default function ProductDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/products/:id");
  const productId = params?.id ? parseInt(params.id) : 0;
  const [quantity, setQuantity] = useState(1);
  const [selectedModel, setSelectedModel] = useState("");
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch product directly using tRPC
  useEffect(() => {
    if (productId <= 0) return;
    
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/trpc/products.list?input={"limit":100,"offset":0}`);
        const data = await response.json();
        const products = data.result?.data?.json || [];
        const found = products.find((p: any) => Number(p.id) === productId);
        setProduct(found || null);
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const utils = trpc.useUtils();
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Product added to cart!");
      utils.cart.list.invalidate();
      setQuantity(1);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <Button variant="outline" onClick={() => setLocation("/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Catalog
          </Button>
        </div>
      </div>
    );
  }

  const basePrice = Number(product.basePrice);
  const totalPrice = basePrice * quantity;
  const discountedPrice = totalPrice;
  const maxQuantity = 100; // Default stock
  const isQuantityExceeded = quantity > maxQuantity;

  let compatibleModels: string[] = [];
  try {
    if (product.compatibleModels) compatibleModels = JSON.parse(product.compatibleModels as string);
  } catch {}

  let alternatePartNumbers: string[] = [];
  try {
    if (product.alternatePartNumbers) alternatePartNumbers = JSON.parse(product.alternatePartNumbers as string);
  } catch {}

  const isCompatible = !selectedModel || compatibleModels.includes(selectedModel);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container py-3 flex items-center gap-2 text-sm">
          <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => setLocation("/")}>Home</Button>
          <span className="text-muted-foreground">/</span>
          <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => setLocation("/products")}>Products</Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium truncate">{product.name}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="flex items-center justify-center bg-secondary/10 rounded-lg p-8 min-h-96">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="max-w-full max-h-96 object-contain" />
            ) : (
              <div className="text-center text-muted-foreground">
                <Package className="h-24 w-24 mx-auto mb-4 opacity-50" />
                <p>No image available</p>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold">{product.name}</h1>
                  <p className="text-muted-foreground">Part #: {product.partNumber}</p>
                </div>
                <Badge variant="secondary">In Stock</Badge>
              </div>
              <p className="text-muted-foreground mt-2">{product.description}</p>
            </div>

            {/* Price */}
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">₹{basePrice.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">per unit</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Minimum order: 1 unit</p>
                </div>
              </CardContent>
            </Card>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  −
                </Button>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
              {isQuantityExceeded && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Quantity exceeds available stock</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Total Price */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted-foreground">Total:</span>
                <span className="text-2xl font-bold">₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (isQuantityExceeded) {
                    toast.error("Quantity exceeds available stock");
                    return;
                  }
                  addToCartMutation.mutate({
                    productId: product.id,
                    quantity,
                  });
                }}
                disabled={addToCartMutation.isPending || isQuantityExceeded}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                asChild
              >
                <a href={`${WHATSAPP_URL}I'm interested in ${product.name} (Part #${product.partNumber})`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            </div>

            {/* Additional Info */}
            {alternatePartNumbers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alternate Part Numbers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {alternatePartNumbers.map((part) => (
                      <Badge key={part} variant="secondary">{part}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
