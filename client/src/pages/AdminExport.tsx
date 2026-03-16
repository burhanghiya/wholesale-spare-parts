import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Database } from "lucide-react";

export default function AdminExport() {
  const handleExport = (type: string) => {
    alert(`Exporting ${type} data...`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Backup & Export</h1>
        <p className="text-muted-foreground">Export data to CSV format</p>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Export all orders with customer details and payment info
            </p>
            <Button
              onClick={() => handleExport("Orders")}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Orders (CSV)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Export all products with pricing and inventory
            </p>
            <Button
              onClick={() => handleExport("Products")}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Products (CSV)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Export all customer data with contact information
            </p>
            <Button
              onClick={() => handleExport("Customers")}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Customers (CSV)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Export all payment transactions and history
            </p>
            <Button
              onClick={() => handleExport("Payments")}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Payments (CSV)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Full Database Backup */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Full Database Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-blue-800">
            Create a complete backup of all data including orders, products, customers, and transactions.
          </p>
          <Button className="w-full" variant="default">
            <Download className="h-4 w-4 mr-2" />
            Create Full Backup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
