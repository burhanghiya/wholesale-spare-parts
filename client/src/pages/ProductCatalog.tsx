import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Grid3X3, List, Package } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProductCatalog() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Check if search query exists in URL
  const hasUrlSearch = location.includes("search=");
  
  const { data: productsData, isLoading } = trpc.products.list.useQuery({ limit: 100, offset: 0 });
  const { data: categoriesData } = trpc.products.getCategories.useQuery();

  // Parse URL for search query
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get('search');
    
    if (urlSearch) {
      setSearchQuery(urlSearch);
      setDebouncedSearch(urlSearch);
    }
  }, []);

  // Parse URL for category (after categoriesData is loaded)
  useEffect(() => {
    if (!categoriesData || categoriesData.length === 0) {
      console.log('[DEBUG] categoriesData not ready yet');
      return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('category');
    
    console.log('[DEBUG] Checking URL category:', urlCategory);
    console.log('[DEBUG] Available categories:', categoriesData.map(c => ({ id: c.id, name: c.name })));
    
    if (urlCategory) {
      const categoryName = decodeURIComponent(urlCategory);
      const foundCat = categoriesData.find((c) => c.name === categoryName);
      console.log('[DEBUG] Looking for category name:', categoryName, 'Found:', foundCat);
      
      if (foundCat) {
        const catIdStr = foundCat.id.toString();
        console.log('[DEBUG] Setting selectedCategory to:', catIdStr);
        setSelectedCategory(catIdStr);
      }
    }
  }, [location, categoriesData]);
  
  // Debounce search
  useEffect(() => {
    if (!hasUrlSearch) {
      const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, hasUrlSearch]);

  const { data: searchResults } = trpc.products.search.useQuery(
    { query: debouncedSearch, categoryId: selectedCategory !== "all" ? parseInt(selectedCategory) : undefined },
    { enabled: debouncedSearch.length > 0 }
  );

  const displayProducts = useMemo(() => {
    // Start with search results if available, otherwise use all products
    let products = debouncedSearch.length > 0 && searchResults ? searchResults : productsData;
    
    if (!products) return [];
    
    console.log('[DEBUG] displayProducts - selectedCategory:', selectedCategory, 'productsCount:', products.length);
    
    // Apply category filter
    if (selectedCategory && selectedCategory !== "all") {
      const catId = selectedCategory;
      console.log('[DEBUG] Filtering by categoryId:', catId);
      const before = products.length;
      products = products.filter((p) => {
        const pCategoryId = typeof p.categoryId === 'number' ? p.categoryId.toString() : String(p.categoryId);
        const matches = pCategoryId === catId;
        if (!matches) {
          console.log(`[DEBUG] Filtering out ${p.name}: categoryId=${pCategoryId} !== ${catId}`);
        }
        return matches;
      });
      console.log('[DEBUG] Filtered from', before, 'to', products.length, 'products');
    }
    
    // Apply sorting
    const sorted = [...products];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
      case "price-high":
        return sorted.sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [productsData, searchResults, selectedCategory, sortBy, debouncedSearch]);

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    // Update URL
    if (value === "all") {
      setLocation("/products");
    } else {
      const categoryName = categoriesData?.find((c) => c.id.toString() === value)?.name;
      if (categoryName) {
        setLocation(`/products?category=${encodeURIComponent(categoryName)}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[oklch(0.22_0.05_260)] py-10">
        <div className="container">
          {hasUrlSearch ? (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Search Results</h1>
              <p className="text-white/60">Showing products matching your search</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white mb-2">Product Catalog</h1>
              <p className="text-white/60">Browse our complete range of wholesale electrical spare parts</p>
            </>
          )}
        </div>
      </div>

      <div className="container py-8 flex-1">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
          {!hasUrlSearch && (
          <div className="flex flex-1 gap-3 w-full md:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by part number, name, brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesData?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 hidden sm:flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{displayProducts.length} products</span>
            <div className="flex border border-border rounded-md">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" className="rounded-r-none" onClick={() => setViewMode("grid")}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" className="rounded-l-none" onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="bg-muted h-48 rounded mb-4" />
                  <div className="bg-muted h-4 rounded mb-2" />
                  <div className="bg-muted h-4 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or category filters</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded mb-4" />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded mb-4 flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">#{product.partNumber}</p>
                    </div>
                    {product.inventory?.quantityInStock > 0 && (
                      <Badge variant="secondary" className="text-xs">In Stock</Badge>
                    )}
                  </div>
                  <p className="text-lg font-bold mb-2">₹{product.basePrice}</p>
                  <p className="text-xs text-muted-foreground mb-4">Stock: {product.inventory?.quantityInStock || 0}</p>
                  <Button className="w-full" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {displayProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded" />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">#{product.partNumber}</p>
                    <p className="text-sm mt-1">₹{product.basePrice} • Stock: {product.inventory?.quantityInStock || 0}</p>
                  </div>
                  <Button size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
