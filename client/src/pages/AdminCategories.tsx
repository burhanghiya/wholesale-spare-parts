import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit2 } from "lucide-react";

export default function AdminCategories() {
  const [categories, setCategories] = useState([
    { id: 1, name: "Ceiling Fans", description: "Indoor ceiling fans", productCount: 2 },
    { id: 2, name: "Wall Fans", description: "Wall mounted fans", productCount: 0 },
    { id: 3, name: "Lighting", description: "Bulbs and fixtures", productCount: 0 },
  ]);

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  const handleAddCategory = () => {
    if (newCategory.name) {
      setCategories([
        ...categories,
        {
          id: Date.now(),
          ...newCategory,
          productCount: 0,
        },
      ]);
      setNewCategory({ name: "", description: "" });
    }
  };

  const handleDeleteCategory = (id: number) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Category Management</h1>
        <p className="text-muted-foreground">Organize products into categories</p>
      </div>

      {/* Add New Category */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Category Name</label>
              <Input
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                placeholder="e.g., Ceiling Fans"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, description: e.target.value })
                }
                placeholder="Category description"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddCategory} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-2">Category Name</th>
                  <th className="text-left py-2 px-2">Description</th>
                  <th className="text-center py-2 px-2">Products</th>
                  <th className="text-center py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{category.name}</td>
                    <td className="py-2 px-2 text-muted-foreground">
                      {category.description}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <Badge variant="outline">{category.productCount}</Badge>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
