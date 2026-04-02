import { IndianRupee, ShoppingBag, Package, Users, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { salesData } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const { data: products = [], isLoading: pLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => { const { data } = await supabase.from("products").select("*"); return data || []; }
  });
  const { data: customers = [], isLoading: cLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => { const { data } = await supabase.from("customers").select("*"); return data || []; }
  });
  const { data: invoices = [], isLoading: iLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => { const { data } = await supabase.from("invoices").select("*").order("date", { ascending: false }); return data || []; }
  });

  if (pLoading || cLoading || iLoading) {
    return <div className="p-12 flex items-center justify-center text-muted-foreground"><Loader2 className="mr-2 animate-spin" /> Loading dashboard...</div>;
  }

  const lowStockProducts = products.filter((p: any) => (p.stock || 0) <= 10);
  const totalRevenue = invoices.reduce((s: number, i: any) => s + (i.grand_total || 0), 0);
  const todaySales = invoices.filter((i: any) => {
    const d = new Date(i.date);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).reduce((s: number, i: any) => s + (i.grand_total || 0), 0);
  
  const pendingPayments = invoices.filter((i: any) => i.status !== "paid").reduce((s: number, i: any) => s + (i.grand_total || 0), 0);
  const pendingCount = invoices.filter((i: any) => i.status !== "paid").length;
  
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} change="From inception" changeType="positive" icon={IndianRupee} />
        <StatCard title="Today's Sales" value={`₹${todaySales.toLocaleString()}`} change="Realtime" changeType="positive" icon={TrendingUp} />
        <StatCard title="Total Products" value={products.length.toString()} change="Catalog size" changeType="neutral" icon={Package} />
        <StatCard title="Low Stock Items" value={lowStockProducts.length.toString()} change="Needs attention" changeType={lowStockProducts.length > 0 ? "negative" : "neutral"} icon={AlertTriangle} iconBg={lowStockProducts.length > 0 ? "bg-destructive/10" : ""} />
        <StatCard title="Customers" value={customers.length.toString()} change="Total audience" changeType="positive" icon={Users} />
        <StatCard title="Pending Payments" value={`₹${pendingPayments.toLocaleString()}`} change={`${pendingCount} invoices pending`} changeType={pendingCount > 0 ? "negative" : "neutral"} icon={ShoppingBag} iconBg={pendingCount > 0 ? "bg-warning/10" : ""} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Sales Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₹${v / 1000}K`} />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Legend />
              <Bar dataKey="retail" name="Retail" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="wholesale" name="Wholesale" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Low Stock Alerts</h3>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-4">No low stock items</p>
            ) : null}
            {lowStockProducts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                </div>
                <StatusBadge status="low" label={`${p.stock} left`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">Invoice</th>
                <th className="pb-3 font-medium text-muted-foreground">Customer</th>
                <th className="pb-3 font-medium text-muted-foreground">Date</th>
                <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                <th className="pb-3 font-medium text-muted-foreground">Method</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4 text-muted-foreground">No recent invoices found</td></tr>
              ) : null}
              {recentInvoices.map((inv: any) => (
                <tr key={inv.id} className="border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="py-3 font-medium text-foreground">{inv.invoice_no}</td>
                  <td className="py-3 text-foreground">{inv.customer_name}</td>
                  <td className="py-3 text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="py-3 font-medium text-foreground">₹{inv.grand_total?.toLocaleString()}</td>
                  <td className="py-3"><StatusBadge status="retail" label={inv.payment_method} /></td>
                  <td className="py-3"><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
