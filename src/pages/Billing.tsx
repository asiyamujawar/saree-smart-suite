import { useState, useRef, useMemo } from "react";
import { Plus, Search, Eye, Download, Loader2, Printer, Trash2, ShoppingCart } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  type: "retail" | "wholesale";
  total_purchases: number;
  outstanding: number;
  last_purchase: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  category: string;
}

interface InvoiceItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_no: string;
  customer_name: string;
  date: string;
  items: number;
  total: number;
  gst: number;
  grand_total: number;
  payment_method: string;
  status: "paid" | "pending" | "partial";
  items_detail?: InvoiceItem[];
}

export default function Billing() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const queryClient = useQueryClient();

  // Invoice Form State
  const [customer, setCustomer] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [gst, setGst] = useState("5");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [billingType, setBillingType] = useState<"retail" | "wholesale">("retail");
  
  // Cart State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("1");

  const resetForm = () => {
    setCustomer("");
    setSelectedCustomerId("");
    setGst("5");
    setPaymentMethod("");
    setBillingType("retail");
    setCartItems([]);
    setSelectedProductId("");
    setSelectedQuantity("1");
  };

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data as Customer[];
    },
  });

  // Calculate Cart Totals
  const { cartTotal, cartItemCount } = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => ({
        cartTotal: acc.cartTotal + item.total,
        cartItemCount: acc.cartItemCount + item.quantity,
      }),
      { cartTotal: 0, cartItemCount: 0 }
    );
  }, [cartItems]);

  const addInvoiceMutation = useMutation({
    mutationFn: async (newInvoice: Partial<Invoice>) => {
      const { data, error } = await supabase.from("invoices").insert([newInvoice]).select("*").single();
      if (error) throw error;

      // Auto-stock deduction
      if (newInvoice.items_detail) {
        for (const item of newInvoice.items_detail) {
           const product = products.find(p => p.id === item.product_id);
           if (product) {
              const newStock = Math.max(0, product.stock - item.quantity);
              await supabase.from("products").update({ stock: newStock }).eq("id", product.id);
           }
        }
      }

      // Auto-create customer if manual entry and update stats
      let customerId = selectedCustomerId;
      if (!selectedCustomerId && customer) {
        // Create new customer from manual entry
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([{
            name: customer,
            phone: "N/A", // Default since we don't collect phone in billing
            email: null,
            type: billingType,
            total_purchases: newInvoice.grand_total || 0,
            outstanding: newInvoice.status === "paid" ? 0 : (newInvoice.grand_total || 0),
            last_purchase: new Date().toISOString(),
          }])
          .select("*")
          .single();
        
        if (customerError) throw customerError;
        customerId = newCustomer.id;
      } else if (selectedCustomerId) {
        // Update existing customer stats
        const linked = customers.find(c => c.id === selectedCustomerId);
        if (linked) {
          const grandTotal = newInvoice.grand_total ?? 0;
          const isPaid = newInvoice.status === "paid";
          await supabase.from("customers").update({
            total_purchases: (linked.total_purchases || 0) + grandTotal,
            outstanding: isPaid
              ? linked.outstanding
              : (linked.outstanding || 0) + grandTotal,
            last_purchase: new Date().toISOString(),
          }).eq("id", selectedCustomerId);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Invoice generated & customer updated successfully!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Failed to generate invoice", { description: error.message || "An error occurred" });
    },
  });

  const handleAddToCart = () => {
    if (!selectedProductId) return;
    const qty = parseInt(selectedQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Invalid quantity");
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    if (product.stock < qty) {
      toast.warning(`Warning: Only ${product.stock} items left in stock.`, { duration: 4000 });
    }

    const price = billingType === "wholesale" ? product.wholesale_price : product.retail_price;
    const existingEntryIndex = cartItems.findIndex(i => i.product_id === product.id);
    
    if (existingEntryIndex >= 0) {
      // Update existing
      const updated = [...cartItems];
      const newQty = updated[existingEntryIndex].quantity + qty;
      updated[existingEntryIndex].quantity = newQty;
      updated[existingEntryIndex].total = newQty * price;
      setCartItems(updated);
    } else {
      // Add new
      setCartItems([...cartItems, {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        price,
        quantity: qty,
        total: price * qty
      }]);
    }
    setSelectedProductId("");
    setSelectedQuantity("1");
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleGenerateInvoice = () => {
    if (!customer || !paymentMethod || cartItems.length === 0) {
      toast.error("Please fill in customer, payment method, and add at least one item.");
      return;
    }

    const gstPct = parseFloat(gst);
    const gstAmt = (cartTotal * gstPct) / 100;

    addInvoiceMutation.mutate({
      invoice_no: `INV-${Date.now().toString().slice(-6)}`,
      customer_name: customer,
      items: cartItemCount,
      total: cartTotal,
      gst: gstAmt,
      grand_total: cartTotal + gstAmt,
      payment_method: paymentMethod,
      status: "paid",
      items_detail: cartItems
    });
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !previewInvoice) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${previewInvoice.invoice_no}.pdf`);
      toast.success("PDF Downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!invoiceRef.current || !previewInvoice) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], `${previewInvoice.invoice_no}.pdf`, { type: "application/pdf" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${previewInvoice.invoice_no}`,
          text: `Hello ${previewInvoice.customer_name}, please find your invoice attached. Thank you for shopping with Saree Smart!`,
        });
        toast.success("Shared via WhatsApp successfully");
      } else {
        // Fallback Web Link
        const text = encodeURIComponent(`*Invoice: ${previewInvoice.invoice_no}*\n*Customer:* ${previewInvoice.customer_name}\n*Total:* ₹${previewInvoice.grand_total}\nThank you for shopping with Saree Smart!`);
        window.open(`https://wa.me/?text=${text}`, "_blank");
        toast.info("Opened WhatsApp Web. (Direct PDF attachment sharing is only supported on mobile devices/Safari).");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to share via WhatsApp");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.invoice_no.toLowerCase().includes(search.toLowerCase()) || inv.customer_name.toLowerCase().includes(search.toLowerCase());
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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if(!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => {resetForm(); setIsDialogOpen(true);}}><Plus className="h-4 w-4" /> New Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">Create Invoice</DialogTitle></DialogHeader>
            <div className="grid gap-6 py-2">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg">
                <div className="grid gap-2 lg:col-span-2">
                  <Label>Customer *</Label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={(val) => {
                      if (val === "__manual__") {
                        setSelectedCustomerId("");
                        setCustomer("");
                      } else {
                        setSelectedCustomerId(val);
                        const found = customers.find(c => c.id === val);
                        if (found) {
                          setCustomer(found.name);
                          setBillingType(found.type);
                        }
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} — {c.phone}
                        </SelectItem>
                      ))}
                      <SelectItem value="__manual__">+ Enter manually</SelectItem>
                    </SelectContent>
                  </Select>
                  {!selectedCustomerId && (
                    <Input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Or type customer name" />
                  )}
                </div>
                <div className="grid gap-2"><Label>Pricing Tier *</Label>
                  <Select value={billingType} onValueChange={(v: "retail" | "wholesale") => setBillingType(v)}><SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
                    <SelectContent><SelectItem value="retail">Retail</SelectItem><SelectItem value="wholesale">Wholesale</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Payment Method *</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                    <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="upi">UPI</SelectItem><SelectItem value="card">Card</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="border border-border rounded-lg overflow-hidden">
                 <div className="bg-muted p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-end">
                    <div className="grid gap-2 flex-1">
                      <Label>Search Product</Label>
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                        <SelectContent>
                           {products.map(p => (
                             <SelectItem key={p.id} value={p.id}>
                               <span className="flex items-center justify-between w-full">
                                  <span>{p.name} ({p.sku})</span>
                                  <span className="ml-4 text-xs text-muted-foreground">Stock: {p.stock}</span>
                               </span>
                             </SelectItem>
                           ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2 w-24">
                      <Label>Quantity</Label>
                      <Input type="number" min="1" value={selectedQuantity} onChange={e => setSelectedQuantity(e.target.value)} />
                    </div>
                    <Button onClick={handleAddToCart} variant="secondary" className="gap-2"><ShoppingCart className="w-4 h-4"/> Add Item</Button>
                 </div>

                 {/* Cart Table */}
                 <table className="w-full text-sm">
                   <thead className="bg-muted/10 border-b border-border">
                     <tr>
                        <th className="py-2 px-4 text-left font-medium text-muted-foreground">Item</th>
                        <th className="py-2 px-4 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider">Rate</th>
                        <th className="py-2 px-4 text-center font-medium text-muted-foreground text-xs uppercase tracking-wider">Qty</th>
                        <th className="py-2 px-4 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider">Subtotal</th>
                        <th className="py-2 px-4 text-center font-medium text-muted-foreground w-12 text-xs"></th>
                     </tr>
                   </thead>
                   <tbody>
                      {cartItems.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Cart is empty</td></tr>}
                      {cartItems.map((item) => (
                         <tr key={item.id} className="border-b border-border/50">
                           <td className="py-2 px-4">{item.name}</td>
                           <td className="py-2 px-4 text-center">₹{item.price.toLocaleString()}</td>
                           <td className="py-2 px-4 text-center">{item.quantity}</td>
                           <td className="py-2 px-4 text-right font-medium">₹{item.total.toLocaleString()}</td>
                           <td className="py-2 px-4 text-center">
                             <button onClick={() => handleRemoveFromCart(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                           </td>
                         </tr>
                      ))}
                   </tbody>
                 </table>
              </div>

              <div className="flex justify-end pt-4">
                 <div className="w-full sm:w-1/2 rounded-lg border border-border p-4 bg-muted/10">
                    <div className="flex justify-between py-1 text-sm"><span className="text-muted-foreground">Items Total:</span><span>₹{cartTotal.toLocaleString()}</span></div>
                    <div className="flex justify-between py-1 text-sm items-center border-b border-border mb-2 pb-2">
                       <span className="text-muted-foreground flex items-center gap-2">GST % <Input className="w-16 h-7 text-xs" type="number" value={gst} onChange={e => setGst(e.target.value)}/></span>
                       <span>₹{((cartTotal * parseFloat(gst || "0")) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 text-xl font-bold text-foreground">
                       <span>Grand Total:</span>
                       <span className="text-primary">₹{(cartTotal + (cartTotal * parseFloat(gst || "0")) / 100).toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              <div className="flex justify-end border-t border-border pt-4">
                 <Button onClick={handleGenerateInvoice} disabled={addInvoiceMutation.isPending || cartItems.length === 0} className="w-full sm:w-auto h-12 px-8">
                   {addInvoiceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Generate & Deduct Stock
                 </Button>
              </div>
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
          {invoicesLoading ? (
             <div className="p-8 text-center text-muted-foreground flex items-center justify-center">
                 <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading invoices...
             </div>
          ) : (
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
              {filtered.length === 0 ? (
                <tr>
                   <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No invoices found. Data empty.</td>
                </tr>
              ) : null}
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{inv.invoice_no}</td>
                  <td className="px-4 py-3 text-foreground">{inv.customer_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center text-foreground">{inv.items}</td>
                  <td className="px-4 py-3 text-right text-foreground">₹{inv.total?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">₹{inv.gst?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">₹{inv.grand_total?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-center uppercase text-xs text-muted-foreground">{inv.payment_method}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setPreviewInvoice(inv)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => { setPreviewInvoice(inv); setTimeout(handleDownloadPdf, 500); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Download className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Preview Dialog Modal */}
      <Dialog open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
        <DialogContent className="max-w-2xl bg-white text-zinc-950 sm:max-w-3xl">
          <div className="flex justify-between items-center mb-0 border-b border-zinc-100 pb-4">
            <DialogTitle className="text-xl font-bold font-display text-zinc-900">Invoice Preview</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                Download PDF
              </Button>
              <Button className="bg-[#25D366] hover:bg-[#25D366]/90 text-white" size="sm" onClick={handleShareWhatsApp} disabled={isGeneratingPdf}>
                WhatsApp PDF
              </Button>
            </div>
          </div>
          
          {previewInvoice && (
            <div ref={invoiceRef} className="p-10 bg-white text-black border border-zinc-200 rounded-lg shadow-sm">
               {/* Invoice Header */}
               <div className="flex justify-between border-b border-zinc-200 pb-6 mb-6">
                  <div>
                     <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Saree Smart</h2>
                     <p className="text-sm text-zinc-500 mt-2">123 Fashion Street, Silk Hub</p>
                  </div>
                  <div className="text-right">
                     <h3 className="text-2xl font-light tracking-widest text-zinc-400 uppercase">Invoice</h3>
                     <p className="text-base font-semibold mt-2 text-zinc-800">{previewInvoice.invoice_no}</p>
                     <p className="text-sm text-zinc-500 mt-1">Date: {new Date(previewInvoice.date).toLocaleDateString()}</p>
                  </div>
               </div>

               {/* Customer Details */}
               <div className="mb-8">
                  <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2 font-semibold">Billed To</p>
                  <p className="font-semibold text-lg text-zinc-900">{previewInvoice.customer_name}</p>
               </div>

               {/* Items Table Summarized */}
               <table className="w-full text-sm mb-8">
                  <thead>
                     <tr className="border-b border-zinc-200 text-zinc-500">
                        <th className="text-left font-semibold py-3 px-2 uppercase tracking-wide text-xs">Description</th>
                        <th className="text-center font-semibold py-3 px-2 uppercase tracking-wide text-xs">Qty</th>
                        <th className="text-right font-semibold py-3 px-2 uppercase tracking-wide text-xs">Rate</th>
                        <th className="text-right font-semibold py-3 px-2 uppercase tracking-wide text-xs">Total</th>
                     </tr>
                  </thead>
                  <tbody>
                     {previewInvoice.items_detail && previewInvoice.items_detail.length > 0 ? (
                       previewInvoice.items_detail.map((item, idx) => (
                         <tr key={idx} className="border-b border-zinc-100">
                            <td className="py-4 px-2 text-zinc-800 font-medium">{item.name}</td>
                            <td className="py-4 px-2 text-center text-zinc-600">{item.quantity}</td>
                            <td className="py-4 px-2 text-right text-zinc-600">₹{item.price.toLocaleString()}</td>
                            <td className="py-4 px-2 text-right text-zinc-800 font-medium">₹{item.total.toLocaleString()}</td>
                         </tr>
                       ))
                     ) : (
                       <tr className="border-b border-zinc-100">
                          <td className="py-4 px-2 text-zinc-800 font-medium">Assorted Sarees & Goods (Legacy)</td>
                          <td className="py-4 px-2 text-center text-zinc-600">{previewInvoice.items}</td>
                          <td className="py-4 px-2 text-right text-zinc-600">-</td>
                          <td className="py-4 px-2 text-right text-zinc-800 font-medium">₹{previewInvoice.total?.toLocaleString() || 0}</td>
                       </tr>
                     )}
                  </tbody>
               </table>

               {/* Totals */}
               <div className="flex justify-end pt-4">
                  <div className="w-1/2 min-w-[250px]">
                     <div className="flex justify-between py-2 text-sm text-zinc-600">
                        <span>Subtotal</span>
                        <span className="font-medium text-zinc-900">₹{previewInvoice.total?.toLocaleString() || 0}</span>
                     </div>
                     <div className="flex justify-between py-2 text-sm text-zinc-600 border-b border-zinc-200 mb-2">
                        <span>GST (Taxes)</span>
                        <span className="font-medium text-zinc-900">₹{previewInvoice.gst?.toLocaleString() || 0}</span>
                     </div>
                     <div className="flex justify-between py-3 text-lg font-bold text-zinc-900 border-b-2 border-zinc-900 mb-4 bg-zinc-50 px-2 rounded-sm mt-1">
                        <span>Grand Total</span>
                        <span>₹{previewInvoice.grand_total?.toLocaleString() || 0}</span>
                     </div>
                     <div className="flex justify-between text-sm px-2 mt-4">
                        <span className="text-zinc-500 font-medium tracking-wide">Payment Status</span>
                        <span className="uppercase font-bold tracking-wider text-green-700">{previewInvoice.status} ({previewInvoice.payment_method})</span>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
