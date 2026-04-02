import { salesData } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const COLORS = ["hsl(345, 60%, 28%)", "hsl(38, 70%, 55%)", "hsl(152, 55%, 40%)", "hsl(210, 70%, 50%)", "hsl(0, 72%, 51%)"];

export default function Reports() {
  const eodRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: products = [], isLoading: pLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => { const { data } = await supabase.from("products").select("*"); return data || []; }
  });
  const { data: invoices = [], isLoading: iLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => { const { data } = await supabase.from("invoices").select("*"); return data || []; }
  });

  if (pLoading || iLoading) {
    return <div className="p-12 flex items-center justify-center text-muted-foreground"><Loader2 className="mr-2 animate-spin" /> Loading reports...</div>;
  }

  const categoryData = Object.entries(
    products.reduce<Record<string, number>>((acc, p: any) => {
      acc[p.category] = (acc[p.category] || 0) + (p.stock || 0);
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const totalRevenue = invoices.reduce((s, i: any) => s + (i.grand_total || 0), 0);
  const totalGST = invoices.reduce((s, i: any) => s + (i.gst || 0), 0);
  const paidRevenue = invoices.filter((i: any) => i.status === "paid").reduce((s, i: any) => s + (i.grand_total || 0), 0);

  const bestProducts = [...products].sort((a: any, b: any) => {
      const vA = (a.retail_price || 0) * (a.stock || 0);
      const vB = (b.retail_price || 0) * (b.stock || 0);
      return vB - vA;
  }).slice(0, 5);

  const maxValue = bestProducts.length > 0 ? (bestProducts[0].retail_price * bestProducts[0].stock) : 1;

  // EOD Calculations
  const today = new Date().toLocaleDateString();
  const todaysInvoices = invoices.filter((i: any) => new Date(i.date).toLocaleDateString() === today);
  const todaysRevenue = todaysInvoices.reduce((acc, i: any) => acc + (i.grand_total || 0), 0);
  const todaysPaid = todaysInvoices.filter((i:any) => i.status === "paid" || i.status === "partial").reduce((acc, i: any) => acc + (i.grand_total || 0), 0);

  const shareEOD = async () => {
    if (!eodRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(eodRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], `EOD_Report_${today.replace(/\//g, "-")}.pdf`, { type: "application/pdf" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `EOD Report - ${today}`,
          text: `Daily End-of-Day Sales Report for ${today}. Total Revenue: ₹${todaysRevenue.toLocaleString()}\nPaid: ₹${todaysPaid.toLocaleString()}`,
        });
        toast.success("Shared EOD PDF successfully");
      } else {
        const text = encodeURIComponent(`*EOD Sales Report: ${today}*\n*Total Invoices:* ${todaysInvoices.length}\n*Total Revenue:* ₹${todaysRevenue.toLocaleString()}\n*Paid:* ₹${todaysPaid.toLocaleString()}\n*Pending:* ₹${(todaysRevenue - todaysPaid).toLocaleString()}\n(PDF attachment requires mobile device)`);
        window.open(`https://wa.me/?text=${text}`, "_blank");
        toast.info("Opened WhatsApp Web. Desktop browsers don't support auto-attaching PDFs. A text summary was generated.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate EOD Report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Insights into your business performance</p>
        </div>
        <Button onClick={shareEOD} disabled={isGenerating} className="bg-[#25D366] hover:bg-[#25D366]/90 text-white shadow-md gap-2">
           {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
           Share Daily EOD Report
        </Button>
      </div>

      {/* Hidden EOD Report for PDF Generation */}
      <div className="absolute left-[-9999px] top-[-9999px]">
         <div ref={eodRef} className="w-[800px] p-10 bg-white text-black border border-zinc-200">
             <div className="text-center border-b border-zinc-200 pb-6 mb-8">
                <h1 className="text-4xl font-bold font-serif mb-2 text-zinc-900">Mangalmurti Sarees</h1>
                <h2 className="text-xl font-semibold text-zinc-500 uppercase tracking-widest mt-4">End of Day Sales Report</h2>
                <p className="text-zinc-500 mt-2 font-medium">Date Generated: {today}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-6 mb-10">
                 <div className="bg-zinc-50 p-6 border border-zinc-200 rounded-lg">
                     <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Total Invoices Today</p>
                     <p className="text-4xl font-black text-zinc-800">{todaysInvoices.length}</p>
                 </div>
                 <div className="bg-zinc-50 p-6 border border-zinc-200 rounded-lg">
                     <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Today's Revenue Total</p>
                     <p className="text-4xl font-black text-green-700">₹{todaysRevenue.toLocaleString()}</p>
                 </div>
                 <div className="bg-zinc-50 p-6 border border-zinc-200 rounded-lg">
                     <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Collected (Paid)</p>
                     <p className="text-4xl font-black text-green-600">₹{todaysPaid.toLocaleString()}</p>
                 </div>
                 <div className="bg-zinc-50 p-6 border border-zinc-200 rounded-lg">
                     <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Outstanding For Today</p>
                     <p className="text-4xl font-black text-amber-600">₹{(todaysRevenue - todaysPaid).toLocaleString()}</p>
                 </div>
             </div>

             <div>
                 <h3 className="font-bold text-lg border-b-2 border-zinc-800 pb-2 mb-4 uppercase tracking-wider text-zinc-800">Invoice Breakdown</h3>
                 <table className="w-full text-sm text-left">
                     <thead>
                        <tr className="border-b-2 border-zinc-300 bg-zinc-50">
                           <th className="p-3 font-bold text-zinc-600 uppercase tracking-wider text-xs">Invoice #</th>
                           <th className="p-3 font-bold text-zinc-600 uppercase tracking-wider text-xs">Customer</th>
                           <th className="p-3 font-bold text-zinc-600 uppercase tracking-wider text-xs text-center">Status</th>
                           <th className="p-3 font-bold text-zinc-600 uppercase tracking-wider text-xs text-right">Amount</th>
                        </tr>
                     </thead>
                     <tbody>
                        {todaysInvoices.length === 0 ? (
                           <tr><td colSpan={4} className="p-6 text-center text-zinc-500 italic">No sales recorded today.</td></tr>
                        ) : todaysInvoices.map((inv: any, idx) => (
                           <tr key={idx} className="border-b border-zinc-100">
                              <td className="p-3 font-semibold text-zinc-700">{inv.invoice_no}</td>
                              <td className="p-3 text-zinc-900">{inv.customer_name}</td>
                              <td className="p-3 text-center">
                                  <span className={`px-2 py-1 uppercase text-[10px] font-bold rounded-sm ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                     {inv.status}
                                  </span>
                              </td>
                              <td className="p-3 text-right font-medium text-zinc-900">₹{inv.grand_total?.toLocaleString() || 0}</td>
                           </tr>
                        ))}
                     </tbody>
                 </table>
             </div>
             
             <div className="mt-16 text-center text-xs text-zinc-400 border-t border-zinc-200 pt-6">
                Auto-generated by Mangalmurti Saree Smart Suite • Confidential
             </div>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Revenue generated</p>
          <p className="mt-1 text-2xl font-bold font-display text-foreground">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">GST Collected</p>
          <p className="mt-1 text-2xl font-bold font-display text-foreground">₹{totalGST.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Successfully Collected (Paid)</p>
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
          {bestProducts.length === 0 && <p className="text-sm text-muted-foreground">No products available.</p>}
          {bestProducts.map((p: any, i: number) => {
            const value = (p.retail_price || 0) * (p.stock || 0);
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
