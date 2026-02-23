import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { customers } from "@/lib/mock-data";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Customers() {
  const [search, setSearch] = useState("");
  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your customer records</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Customer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Add Customer</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2"><Label>Full Name</Label><Input placeholder="Customer name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Phone</Label><Input placeholder="Phone number" /></div>
                <div className="grid gap-2"><Label>Email</Label><Input placeholder="Email" /></div>
              </div>
              <div className="grid gap-2"><Label>Type</Label>
                <Select><SelectTrigger><SelectValue placeholder="Customer type" /></SelectTrigger>
                  <SelectContent><SelectItem value="retail">Retail</SelectItem><SelectItem value="wholesale">Wholesale</SelectItem></SelectContent>
                </Select>
              </div>
              <Button className="mt-2">Save Customer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <div key={c.id} className="stat-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {c.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.phone}</p>
              </div>
              <StatusBadge status={c.type} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total Purchases</p>
                <p className="font-semibold text-foreground">₹{c.totalPurchases.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Outstanding</p>
                <p className="font-semibold text-foreground">₹{c.outstanding.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Last purchase: {c.lastPurchase}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
