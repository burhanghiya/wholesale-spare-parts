import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ShoppingCart, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ProductDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/products/:id");
  const productId = params?.id ? parseInt(params.id) : 0;

  const [quantity, setQuantity] = useState(1);
  const [selectedModel, setSelectedModel] = useState("");

  // Fetch product details
  const { data: productData, isLoading } = trpc.products.getById.useQuery(productId, {
    enabled: productId > 0,
  });

  // Add to cart mutation
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      alert("Product added to cart!");
      setQuantity(1);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!productData?.product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Button variant="ghost" onClick={() => setLocation("/products")} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Catalog
          </Button>
          <p className="text-muted-foreground">Product not found</p>
        </div>
      </div>
    );
  }

  const { product, inventory, pricing } = productData;
  const basePrice = Number(product.basePrice);
  const totalPrice = basePrice * quantity;

  // Find applicable pricing tier
  let discountedPrice = totalPrice;
  let discountPercentage = 0;
  if (pricing && pricing.length > 0) {
    for (const tier of pricing) {
      if (quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)) {
        if (tier.specialPrice) {
          discountedPrice = Number(tier.specialPrice) * quantity;
        } else {
          discountPercentage = Number(tier.discountPercentage);
          discountedPrice = totalPrice * (1 - discountPercentage / 100);
        }
        break;
      }
    }
  }

  const isCompatible = selectedModel && product.compatibleModels
    ? JSON.parse(product.compatibleModels as any).includes(selectedModel)
    : true;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/products")} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Catalog
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Product Image */}
          <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="text-muted-foreground text-center">
                <p>Product Image</p>
                <p className="text-sm">{product.partNumber}</p>
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
                <Badge variant={inventory?.quantityInStock ? "default" : "destructive"}>
                  {inventory?.quantityInStock ? `${inventory.quantityInStock} in stock` : "Out of Stock"}
                </Badge>
              </div>
              {product.description && (
                <p className="text-muted-foreground mt-4">{product.description}</p>
              )}
            </div>

            {/* Pricing Tiers */}
            {pricing && pricing.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Volume Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {pricing.map((tier, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b last:border-0">
                        <span className="text-muted-foreground">
                          {tier.minQuantity}+ units
                        </span>
                        {tier.specialPrice ? (
                          <span className="font-semibold">₹{Number(tier.specialPrice).toFixed(2)} each</span>
                        ) : (
                          <span className="font-semibold">{Number(tier.discountPercentage)}% off</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compatibility Checker */}
            {product.compatibleModels && JSON.parse(product.compatibleModels as any).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compatibility Checker</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Your Model</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="">Choose a model...</option>
                        {JSON.parse(product.compatibleModels as any).map((model: string) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedModel && (
                      <Alert className={isCompatible ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                        <div className="flex items-center gap-2">
                          {isCompatible ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <AlertDescription className={isCompatible ? "text-green-800" : "text-red-800"}>
                            {isCompatible ? "Compatible with your model" : "Not compatible with your model"}
                          </AlertDescription>
                        </div>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alternate Part Numbers */}
            {product.alternatePartNumbers && JSON.parse(product.alternatePartNumbers as any).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alternate Part Numbers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(product.alternatePartNumbers as any).map((part: string) => (
                      <Badge key={part} variant="secondary">{part}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add to Cart Section */}
            <Card className="bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quantity</label>
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
                    {inventory?.minimumOrderQuantity && quantity < inventory.minimumOrderQuantity && (
                      <p className="text-xs text-amber-600 mt-2">
                        Minimum order: {inventory.minimumOrderQuantity} units
                      </p>
                    )}
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-muted-foreground">Base Price:</span>
                      <span>₹{basePrice.toFixed(2)}</span>
                    </div>
                    {discountPercentage > 0 && (
                      <div className="flex justify-between items-center mb-4 text-green-600">
                        <span>Discount ({discountPercentage}%):</span>
                        <span>-₹{(totalPrice - discountedPrice).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>₹{discountedPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    disabled={!inventory?.quantityInStock || addToCartMutation.isPending}
                    onClick={() => {
                      addToCartMutation.mutate({
                        productId,
                        quantity,
                      });
                    }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
