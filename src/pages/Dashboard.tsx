import { IndianRupee, ShoppingBag, Package, Users, AlertTriangle, TrendingUp } from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { dashboardStats, salesData, invoices, products } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Dashboard() {
  const lowStockProducts = products.filter((p) => p.stock <= 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Revenue" value={`₹${(dashboardStats.totalRevenue / 1000).toFixed(0)}K`} change="+12.5% from last month" changeType="positive" icon={IndianRupee} />
        <StatCard title="Today's Sales" value={`₹${dashboardStats.todaySales.toLocaleString()}`} change="+8.2% from yesterday" changeType="positive" icon={TrendingUp} />
        <StatCard title="Total Products" value={dashboardStats.totalProducts.toString()} change="12 added this week" changeType="neutral" icon={Package} />
        <StatCard title="Low Stock Items" value={dashboardStats.lowStock.toString()} change="Needs attention" changeType="negative" icon={AlertTriangle} iconBg="bg-destructive/10" />
        <StatCard title="Customers" value={dashboardStats.totalCustomers.toString()} change="+5 this month" changeType="positive" icon={Users} />
        <StatCard title="Pending Payments" value={`₹${(dashboardStats.pendingPayments / 1000).toFixed(1)}K`} change="3 invoices pending" changeType="negative" icon={ShoppingBag} iconBg="bg-warning/10" />
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
            {lowStockProducts.map((p) => (
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
                <th className="pb-3 font-medium text-muted-foreground">Type</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-medium text-foreground">{inv.invoiceNo}</td>
                  <td className="py-3 text-foreground">{inv.customer}</td>
                  <td className="py-3 text-muted-foreground">{inv.date}</td>
                  <td className="py-3 font-medium text-foreground">₹{inv.grandTotal.toLocaleString()}</td>
                  <td className="py-3"><StatusBadge status={inv.type} /></td>
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
