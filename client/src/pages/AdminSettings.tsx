import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: "Patel Electricals",
    siteDescription: "Wholesale Electrical Spare Parts",
    contactEmail: "contact@patelelectricals.com",
    contactPhone: "8780657095",
    address: "Udhana, Surat - 394210",
    paymentGateway: "Stripe",
    shippingProvider: "Custom",
    taxRate: "18",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const updateSettingsMutation = trpc.system.updateSettings.useMutation();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettingsMutation.mutateAsync(settings);
      setSaveMessage("✅ Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("❌ Error saving settings");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure website and payment settings</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Site Name</label>
            <Input
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Site Description</label>
            <Input
              value={settings.siteDescription}
              onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Contact Email</label>
            <Input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Contact Phone</label>
            <Input
              value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <Input
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Payment Gateway</label>
            <Input
              value={settings.paymentGateway}
              onChange={(e) => setSettings({ ...settings, paymentGateway: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tax Rate (%)</label>
            <Input
              type="number"
              value={settings.taxRate}
              onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shipping Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Shipping Provider</label>
            <Input
              value={settings.shippingProvider}
              onChange={(e) => setSettings({ ...settings, shippingProvider: e.target.value })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="space-y-2">
        <Button onClick={handleSave} size="lg" className="w-full md:w-auto" disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
        {saveMessage && (
          <p className={`text-sm font-medium ${saveMessage.includes("✅") ? "text-green-600" : "text-red-600"}`}>
            {saveMessage}
          </p>
        )}
      </div>
    </div>
  );
}
