import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminCategories() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: categories = [], isLoading } = trpc.products.getCategories.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === 'admin' }
  );

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const addCategory = trpc.products.addCategory.useMutation({
    onSuccess: () => {
      toast.success("Category added successfully!");
      setNewCategory({ name: "", description: "" });
      utils.products.getCategories.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCategory = trpc.products.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("Category deleted!");
      utils.products.getCategories.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast.error("Category name is required!");
      return;
    }
    addCategory.mutate({
      name: newCategory.name,
      description: newCategory.description || undefined,
    });
  };

  const handleDeleteCategory = (id: number) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm !== null) {
      deleteCategory.mutate(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Button 
                onClick={handleAddCategory}
                disabled={addCategory.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addCategory.isPending ? "Adding..." : "Add Category"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No categories yet. Create one above!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Category Name</th>
                    <th className="text-left py-2 px-2">Description</th>
                    <th className="text-center py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category: any) => (
                    <tr key={category.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 text-muted-foreground">{category.id}</td>
                      <td className="py-2 px-2 font-medium">{category.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">
                        {category.description || "-"}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deleteCategory.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteCategory.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
