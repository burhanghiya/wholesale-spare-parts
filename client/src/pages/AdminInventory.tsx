import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingDown, Package } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminInventory() {
  const [reorderLevel, setReorderLevel] = useState(5);
  const { data: products } = trpc.products.getAll.useQuery();

  const lowStockProducts = products?.filter(
    (p) => Number(p.stock) <= reorderLevel
  ) || [];

  const totalValue = products?.reduce(
    (sum, p) => sum + Number(p.basePrice) * Number(p.stock),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">Monitor stock levels and reorder alerts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(totalValue / 100000).toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reorder Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="w-16 h-8"
                min="1"
              />
              <span className="text-xs text-muted-foreground">units</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-red-200"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">#{product.partNumber}</p>
                  </div>
                  <Badge variant="destructive">
                    {product.stock} units
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2">Product</th>
                  <th className="text-left py-2 px-2">Part #</th>
                  <th className="text-right py-2 px-2">Stock</th>
                  <th className="text-right py-2 px-2">Price</th>
                  <th className="text-right py-2 px-2">Total Value</th>
                  <th className="text-center py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {products?.map((product) => {
                  const value = Number(product.basePrice) * Number(product.stock);
                  const isLowStock = Number(product.stock) <= reorderLevel;

                  return (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2">{product.name}</td>
                      <td className="py-2 px-2 font-mono text-xs">{product.partNumber}</td>
                      <td className="py-2 px-2 text-right font-medium">{product.stock}</td>
                      <td className="py-2 px-2 text-right">₹{Number(product.basePrice).toFixed(0)}</td>
                      <td className="py-2 px-2 text-right">₹{value.toFixed(0)}</td>
                      <td className="py-2 px-2 text-center">
                        {isLowStock ? (
                          <Badge variant="destructive" className="flex items-center gap-1 justify-center">
                            <TrendingDown className="h-3 w-3" />
                            Low
                          </Badge>
                        ) : (
                          <Badge variant="default" className="flex items-center gap-1 justify-center">
                            <Package className="h-3 w-3" />
                            OK
                          </Badge>
                        )}
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
