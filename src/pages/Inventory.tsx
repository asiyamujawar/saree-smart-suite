import { products } from "@/lib/mock-data";
import StatusBadge from "@/components/StatusBadge";
import { Package, AlertTriangle, TrendingDown, ArrowUpDown } from "lucide-react";
import StatCard from "@/components/StatCard";

export default function Inventory() {
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const lowStock = products.filter((p) => p.stock <= 10);
  const totalValue = products.reduce((s, p) => s + p.retailPrice * p.stock, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">Track stock levels and movements</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Stock" value={totalStock.toString()} icon={Package} change={`${products.length} products`} />
        <StatCard title="Low Stock Items" value={lowStock.length.toString()} icon={AlertTriangle} iconBg="bg-destructive/10" change="Reorder needed" changeType="negative" />
        <StatCard title="Inventory Value" value={`₹${(totalValue / 100000).toFixed(1)}L`} icon={TrendingDown} change="At retail price" />
        <StatCard title="Stock Movements" value="47" icon={ArrowUpDown} change="This month" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display text-lg font-semibold text-foreground">Stock Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Current Stock</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">{p.stock}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={p.stock <= 5 ? "low" : p.stock <= 10 ? "pending" : "ok"} label={p.stock <= 5 ? "Critical" : p.stock <= 10 ? "Low" : "In Stock"} />
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">₹{(p.retailPrice * p.stock).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
