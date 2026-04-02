import { useState } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
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

export default function Customers() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
              <p className="text-xs text-muted-foreground">Last purchase: {c.last_purchase ? new Date(c.last_purchase).toLocaleDateString() : "Never"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
