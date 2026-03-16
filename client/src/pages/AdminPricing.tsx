import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Percent } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminPricing() {
  const [bulkDiscount, setBulkDiscount] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const { data: products } = trpc.products.getAll.useQuery();

  const handleBulkPriceUpdate = () => {
    alert("Bulk price update: Apply " + bulkDiscount + "% discount to selected products");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pricing Management</h1>
        <p className="text-muted-foreground">Manage product prices and bulk pricing</p>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Price Update</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Discount %</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={bulkDiscount}
                  onChange={(e) => setBulkDiscount(Number(e.target.value))}
                  placeholder="Enter discount percentage"
                  min="0"
                  max="100"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Selected Products</label>
              <div className="mt-1 p-2 bg-muted rounded text-sm">
                {selectedProducts.length} products selected
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={handleBulkPriceUpdate} className="w-full">
                Apply Discount
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Product Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="text-left py-2 px-2">Product</th>
                  <th className="text-left py-2 px-2">Part #</th>
                  <th className="text-right py-2 px-2">Base Price</th>
                  <th className="text-right py-2 px-2">Wholesale Price</th>
                  <th className="text-right py-2 px-2">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {products?.map((product) => {
                  const basePrice = Number(product.basePrice);
                  const margin = 20; // Default margin

                  return (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          className="rounded"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, Number(product.id)]);
                            } else {
                              setSelectedProducts(selectedProducts.filter((id) => id !== Number(product.id)));
                            }
                          }}
                        />
                      </td>
                      <td className="py-2 px-2">{product.name}</td>
                      <td className="py-2 px-2 font-mono text-xs">{product.partNumber}</td>
                      <td className="py-2 px-2 text-right">₹{basePrice.toFixed(0)}</td>
                      <td className="py-2 px-2 text-right font-medium">
                        ₹{(basePrice * 0.85).toFixed(0)}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <Badge variant="outline">{margin}%</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
