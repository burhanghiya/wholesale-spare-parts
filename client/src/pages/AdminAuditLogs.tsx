import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export default function AdminAuditLogs() {
  const logs = [
    {
      id: 1,
      action: "Product Updated",
      user: "admin@patel.com",
      details: "Ceiling fan price changed from ₹1350 to ₹1300",
      timestamp: "2026-03-15 20:45:00",
      type: "update",
    },
    {
      id: 2,
      action: "Order Status Changed",
      user: "admin@patel.com",
      details: "Order ORD-1773604452721 marked as delivered",
      timestamp: "2026-03-15 20:30:00",
      type: "update",
    },
    {
      id: 3,
      action: "Inventory Adjusted",
      user: "admin@patel.com",
      details: "Ceiling fan stock decreased from 49 to 48 units",
      timestamp: "2026-03-15 20:15:00",
      type: "update",
    },
    {
      id: 4,
      action: "New Product Added",
      user: "admin@patel.com",
      details: "Added new product: Wall Fan",
      timestamp: "2026-03-15 19:00:00",
      type: "create",
    },
    {
      id: 5,
      action: "Settings Changed",
      user: "admin@patel.com",
      details: "Website tax rate updated to 18%",
      timestamp: "2026-03-15 18:30:00",
      type: "update",
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "create":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Track all changes made in admin panel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Changes today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">admin@patel.com</div>
            <p className="text-xs text-muted-foreground">Last active</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 bg-muted rounded border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{log.action}</p>
                    <Badge className={getTypeColor(log.type)} variant="outline">
                      {log.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.details}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{log.user}</span>
                    <span>•</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
