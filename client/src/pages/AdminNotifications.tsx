import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminNotifications() {
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  const [isSending, setIsSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");
  const [notifications, setNotifications] = useState([
    { id: 1, type: "order", message: "Order confirmed", date: "2026-03-15", status: "sent" },
    { id: 2, type: "promo", message: "New discount available", date: "2026-03-14", status: "sent" },
  ]);

  const sendNotificationMutation = trpc.system.sendNotification.useMutation();

  const handleSendNotification = async () => {
    if (!message.trim()) {
      setSendMessage("❌ Please enter a message");
      setTimeout(() => setSendMessage(""), 3000);
      return;
    }

    try {
      setIsSending(true);
      await sendNotificationMutation.mutateAsync({
        recipientType: recipientType as "all" | "order" | "promo" | "support",
        message,
      });

      // Add to notification history
      setNotifications([
        {
          id: Date.now(),
          type: recipientType,
          message,
          date: new Date().toISOString().split("T")[0],
          status: "sent",
        },
        ...notifications,
      ]);

      setMessage("");
      setSendMessage("✅ Notification sent successfully!");
      setTimeout(() => setSendMessage(""), 3000);
    } catch (error) {
      setSendMessage("❌ Error sending notification");
      setTimeout(() => setSendMessage(""), 3000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Send custom messages to customers</p>
      </div>

      {/* Send Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Recipient Type</label>
            <select
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="all">All Customers</option>
              <option value="order">Order Customers</option>
              <option value="promo">Promotional</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              className="w-full mt-1 px-3 py-2 border rounded-md min-h-24"
            />
          </div>
          <div className="space-y-2">
            <Button onClick={handleSendNotification} className="flex-1" disabled={isSending}>
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send Notification"}
            </Button>
            {sendMessage && (
              <p className={`text-sm font-medium ${sendMessage.includes("✅") ? "text-green-600" : "text-red-600"}`}>
                {sendMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-center justify-between p-3 bg-muted rounded border"
              >
                <div className="flex-1">
                  <p className="font-medium">{notif.message}</p>
                  <p className="text-sm text-muted-foreground">
                    {notif.date} • {notif.type}
                  </p>
                </div>
                <Badge variant="default">{notif.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
