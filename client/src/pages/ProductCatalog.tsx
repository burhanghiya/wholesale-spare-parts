import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, ChevronLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ProductCatalog() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState("name");

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = trpc.products.list.useQuery({
    limit: 100,
    offset: 0,
  });

  // Fetch categories
  const { data: categoriesData } = trpc.products.getCategories.useQuery();

  // Search products
  const { data: searchResults } = trpc.products.search.useQuery(
    {
      query: searchQuery,
      categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
    },
    { enabled: searchQuery.length > 0 }
  );

  // Filter and sort products
  const displayProducts = useMemo(() => {
    let products = searchQuery.length > 0 ? searchResults : productsData;
    if (!products) return [];

    // Filter by category if selected
    if (selectedCategory) {
      products = products.filter(p => p.categoryId === parseInt(selectedCategory));
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        return [...products].sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
      case "price-high":
        return [...products].sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
      case "name":
      default:
        return [...products].sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [productsData, searchResults, selectedCategory, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Browse our complete range of spare parts</p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Sidebar - Filters */}
          <div className="md:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Search */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Part number, name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categoriesData?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-semibold mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="price-low">Price (Low to High)</SelectItem>
                    <SelectItem value="price-high">Price (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="md:col-span-3">
            {productsLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No products found</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {displayProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setLocation(`/products/${product.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Part #: {product.partNumber}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{product.isActive ? "In Stock" : "Out"}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">₹{Number(product.basePrice).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Base price</p>
                        </div>
                        <Button size="sm" variant="outline">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
