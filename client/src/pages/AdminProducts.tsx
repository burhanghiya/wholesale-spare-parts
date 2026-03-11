import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { AdminNav } from "./AdminDashboard";
import { Plus, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminProducts() {
  const { user, isAuthenticated } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    partNumber: "", name: "", description: "", categoryId: 1,
    basePrice: 0, stock: 0, moq: 1, imageUrl: "",
  });

  const { data: products, isLoading, refetch } = trpc.products.adminList.useQuery(
    { limit: 100, offset: 0 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const { data: categoriesData } = trpc.products.getCategories.useQuery();

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => { toast.success("Product added!"); refetch(); setShowAddDialog(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => { toast.success("Product deleted"); refetch(); },
  });

  const resetForm = () => setNewProduct({ partNumber: "", name: "", description: "", categoryId: 1, basePrice: 0, stock: 0, moq: 1, imageUrl: "" });

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminNav current="/admin/products" />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-muted-foreground">{products?.length || 0} products in catalog</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add New Product</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Part Number *</Label><Input value={newProduct.partNumber} onChange={(e) => setNewProduct({ ...newProduct, partNumber: e.target.value })} placeholder="e.g., MOT-001" className="mt-1" /></div>
                  <div><Label>Category</Label>
                    <select value={newProduct.categoryId} onChange={(e) => setNewProduct({ ...newProduct, categoryId: parseInt(e.target.value) })} className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm">
                      {categoriesData?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {(!categoriesData || categoriesData.length === 0) && <option value={1}>Default</option>}
                    </select>
                  </div>
                </div>
                <div><Label>Product Name *</Label><Input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="e.g., 3-Phase Motor 5HP" className="mt-1" /></div>
                <div><Label>Description</Label><textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Product description..." className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-sm min-h-20" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Base Price (₹) *</Label><Input type="number" value={newProduct.basePrice} onChange={(e) => setNewProduct({ ...newProduct, basePrice: parseFloat(e.target.value) || 0 })} className="mt-1" /></div>
                  <div><Label>Stock Qty</Label><Input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
                  <div><Label>Min Order Qty</Label><Input type="number" value={newProduct.moq} onChange={(e) => setNewProduct({ ...newProduct, moq: parseInt(e.target.value) || 1 })} className="mt-1" /></div>
                </div>
                <div><Label>Image URL</Label><Input value={newProduct.imageUrl} onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })} placeholder="https://..." className="mt-1" /></div>
                <Button className="w-full" disabled={!newProduct.partNumber || !newProduct.name || createMutation.isPending}
                  onClick={() => createMutation.mutate(newProduct)}>
                  {createMutation.isPending ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>)}</div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products yet</h3>
            <p className="text-muted-foreground mb-4">Add your first product to get started</p>
            <Button onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <Card key={product.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" /> : <Package className="h-6 w-6 text-muted-foreground/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <Badge variant={product.isActive ? "default" : "destructive"} className="text-xs flex-shrink-0">
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">#{product.partNumber}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">₹{Number(product.basePrice).toFixed(0)}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive flex-shrink-0"
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(product.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
