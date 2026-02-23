import { salesData, products, invoices } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(345, 60%, 28%)", "hsl(38, 70%, 55%)", "hsl(152, 55%, 40%)", "hsl(210, 70%, 50%)", "hsl(0, 72%, 51%)"];

export default function Reports() {
  const categoryData = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + p.stock;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const totalRevenue = invoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalGST = invoices.reduce((s, i) => s + i.gst, 0);
  const paidRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.grandTotal, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Insights into your business performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="mt-1 text-2xl font-bold font-display text-foreground">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">GST Collected</p>
          <p className="mt-1 text-2xl font-bold font-display text-foreground">₹{totalGST.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Collected</p>
          <p className="mt-1 text-2xl font-bold font-display text-foreground">₹{paidRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Sales */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Monthly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
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

        {/* Category Distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">Stock by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-semibold text-foreground mb-4">Top Products by Value</h3>
        <div className="space-y-3">
          {[...products].sort((a, b) => b.retailPrice * b.stock - a.retailPrice * a.stock).slice(0, 5).map((p, i) => {
            const value = p.retailPrice * p.stock;
            const maxValue = products.reduce((m, pr) => Math.max(m, pr.retailPrice * pr.stock), 0);
            return (
              <div key={p.id} className="flex items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <span className="text-sm font-semibold text-foreground">₹{value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(value / maxValue) * 100}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
