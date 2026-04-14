import { useState } from "react";
import { Plus, Search, Loader2, Receipt, Eye } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

interface InvoiceItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("");

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setType("");
  };

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Customer[];
    },
  });

  const { data: allInvoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const customerInvoices = selectedCustomer
    ? allInvoices.filter(inv =>
        inv.customer_name?.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  const addCustomerMutation = useMutation({
    mutationFn: async (newCustomer: Partial<Customer>) => {
      const { data, error } = await supabase.from("customers").insert([newCustomer]).select("*").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Failed to add customer", { description: error.message || "An error occurred" });
    },
  });

  const handleAddCustomer = () => {
    if (!name || !phone || !type) {
      toast.error("Please fill in the required fields (Name, Phone, Type).");
      return;
    }
    
    addCustomerMutation.mutate({
      name,
      phone,
      email: email || null,
      type: type as "retail" | "wholesale",
      total_purchases: 0,
      outstanding: 0,
      last_purchase: null
    });
  };

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your customer records</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setIsDialogOpen(true)}><Plus className="h-4 w-4" /> Add Customer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Add Customer</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2"><Label>Full Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Phone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" /></div>
                <div className="grid gap-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" /></div>
              </div>
              <div className="grid gap-2"><Label>Type *</Label>
                <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue placeholder="Customer type" /></SelectTrigger>
                  <SelectContent><SelectItem value="retail">Retail</SelectItem><SelectItem value="wholesale">Wholesale</SelectItem></SelectContent>
                </Select>
              </div>
              <Button className="mt-2" onClick={handleAddCustomer} disabled={addCustomerMutation.isPending}>
                {addCustomerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading customers...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card mt-4 text-sm">
          No customers found. Data empty.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="stat-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {c.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                </div>
                <StatusBadge status={c.type} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Total Purchases</p>
                  <p className="font-semibold text-foreground">₹{c.total_purchases?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Outstanding</p>
                  <p className="font-semibold text-foreground">₹{c.outstanding?.toLocaleString() || 0}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Last purchase: {c.last_purchase ? new Date(c.last_purchase).toLocaleDateString() : "Never"}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 h-7 text-xs"
                  onClick={() => setSelectedCustomer(c)}
                >
                  <Receipt className="h-3 w-3" />
                  Bills
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Billing History Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">
              Purchase History - {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              {/* Customer Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Purchases</p>
                  <p className="text-lg font-semibold">₹{selectedCustomer.total_purchases?.toLocaleString() || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-semibold text-orange-600">₹{selectedCustomer.outstanding?.toLocaleString() || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Customer Type</p>
                  <StatusBadge status={selectedCustomer.type} />
                </div>
              </div>

              {/* Invoices Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-4 py-2 border-b">
                  <h3 className="font-medium">Invoice History ({customerInvoices.length})</h3>
                </div>
                
                {customerInvoices.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No invoices found for this customer
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/10 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                          <th className="px-4 py-3 text-center font-medium text-muted-foreground">Items</th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                          <th className="px-4 py-3 text-center font-medium text-muted-foreground">Payment</th>
                          <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                          <th className="px-4 py-3 text-center font-medium text-muted-foreground">Items Purchased</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerInvoices.map((inv) => (
                          <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{inv.invoice_no}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-center">{inv.items}</td>
                            <td className="px-4 py-3 text-right font-semibold">₹{inv.grand_total?.toLocaleString() || 0}</td>
                            <td className="px-4 py-3 text-center uppercase text-xs">{inv.payment_method}</td>
                            <td className="px-4 py-3 text-center"><StatusBadge status={inv.status} /></td>
                            <td className="px-4 py-3">
                              {inv.items_detail && inv.items_detail.length > 0 ? (
                                <div className="space-y-1">
                                  {inv.items_detail.map((item, idx) => (
                                    <div key={idx} className="text-xs">
                                      <span className="font-medium">{item.name}</span>
                                      <span className="text-muted-foreground"> × {item.quantity}</span>
                                      <span className="text-muted-foreground"> @ ₹{item.price.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Legacy invoice</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
