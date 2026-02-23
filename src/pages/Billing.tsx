import { useState } from "react";
import { Plus, Search, Eye, Download } from "lucide-react";
import { invoices } from "@/lib/mock-data";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Billing() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) || inv.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage invoices</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Create Invoice</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Customer Name</Label><Input placeholder="Customer name" /></div>
                <div className="grid gap-2"><Label>Invoice Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent><SelectItem value="retail">Retail</SelectItem><SelectItem value="wholesale">Wholesale</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>GST %</Label><Input type="number" defaultValue="15" /></div>
                <div className="grid gap-2"><Label>Payment Method</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                    <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="card">Card</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mt-2">Generate Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Items</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">GST</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Grand Total</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Payment</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{inv.invoiceNo}</td>
                  <td className="px-4 py-3 text-foreground">{inv.customer}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.date}</td>
                  <td className="px-4 py-3 text-center text-foreground">{inv.items}</td>
                  <td className="px-4 py-3 text-right text-foreground">₹{inv.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">₹{inv.gst.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">₹{inv.grandTotal.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center uppercase text-xs text-muted-foreground">{inv.paymentMethod}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Eye className="h-4 w-4" /></button>
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Download className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
