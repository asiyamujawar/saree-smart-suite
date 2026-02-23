import { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { products, categories } from "@/lib/mock-data";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Products() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === "all" || p.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your saree collection</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Add New Product</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2"><Label>Product Name</Label><Input placeholder="e.g. Banarasi Silk Saree" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Category</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>SKU</Label><Input placeholder="e.g. BSS-001" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Retail Price (₹)</Label><Input type="number" placeholder="0" /></div>
                <div className="grid gap-2"><Label>Wholesale Price (₹)</Label><Input type="number" placeholder="0" /></div>
              </div>
              <div className="grid gap-2"><Label>Stock Quantity</Label><Input type="number" placeholder="0" /></div>
              <Button className="mt-2">Save Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Retail ₹</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Wholesale ₹</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Stock</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3"><StatusBadge status="retail" label={p.category} /></td>
                  <td className="px-4 py-3 text-right text-foreground">₹{p.retailPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-foreground">₹{p.wholesalePrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={p.stock <= 10 ? "low" : "ok"} label={p.stock.toString()} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Edit className="h-4 w-4" /></button>
                      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
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
