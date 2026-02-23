import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your shop preferences</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Shop Details</h3>
          <p className="text-sm text-muted-foreground">Basic business information</p>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2"><Label>Shop Name</Label><Input defaultValue="Mangalmurti Sarees" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Phone</Label><Input defaultValue="+91 9876543210" /></div>
            <div className="grid gap-2"><Label>GST Number</Label><Input defaultValue="27AABCU9603R1ZM" /></div>
          </div>
          <div className="grid gap-2"><Label>Address</Label><Input defaultValue="Main Market, Pune, Maharashtra" /></div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Billing Preferences</h3>
        </div>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Default GST Rate (%)</Label><Input type="number" defaultValue="15" /></div>
            <div className="grid gap-2"><Label>Invoice Prefix</Label><Input defaultValue="INV" /></div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Low Stock Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified when stock is below threshold</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto GST Calculation</p>
              <p className="text-xs text-muted-foreground">Automatically apply GST to invoices</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      <Button>Save Settings</Button>
    </div>
  );
}
