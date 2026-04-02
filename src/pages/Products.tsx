import { useState } from "react";
import { Plus, Search, Edit, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Predefined categories for Saree app
const categories = ["Banarasi Silk", "Kanjeevaram", "Cotton", "Chiffon", "Georgette", "Designer", "Other"];

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  retail_price: number;
  wholesale_price: number;
  stock: number;
  image_url?: string;
}

export default function Products() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCategory("");
    setSku("");
    setRetailPrice("");
    setWholesalePrice("");
    setStock("");
    setImageUrl("");
  };

  const handleEditClick = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setCategory(p.category);
    setSku(p.sku);
    setRetailPrice(p.retail_price.toString());
    setWholesalePrice(p.wholesale_price.toString());
    setStock(p.stock.toString());
    setImageUrl(p.image_url || "");
    setIsDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Image is too large. Please select an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  // Save Product Mutation (Add / Edit)
  const saveProductMutation = useMutation({
    mutationFn: async (productData: Partial<Product> & { id?: string }) => {
      if (productData.id) {
        const { id, ...updateData } = productData;
        const { data, error } = await supabase.from("products").update(updateData).eq("id", id).select("*").single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase.from("products").insert([productData]).select("*").single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(editingId ? "Product updated successfully" : "Product added successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(`Failed to ${editingId ? "update" : "add"} product`, { description: error.message || "An error occurred" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to delete product", { description: error.message });
    }
  });

  const handleSaveProduct = () => {
    if (!name || !category || !sku || !retailPrice || !wholesalePrice || !stock) {
      toast.error("Please fill in all required fields.");
      return;
    }

    saveProductMutation.mutate({
      ...(editingId ? { id: editingId } : {}),
      name,
      category,
      sku,
      retail_price: parseFloat(retailPrice),
      wholesale_price: parseFloat(wholesalePrice),
      stock: parseInt(stock, 10),
      image_url: imageUrl || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this product? This acton cannot be undone.")) {
      deleteProductMutation.mutate(id);
    }
  };

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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => { resetForm(); setIsDialogOpen(true); }}><Plus className="h-4 w-4" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle className="font-display">{editingId ? "Edit Product" : "Add New Product"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2"><Label>Product Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Banarasi Silk Saree" /></div>
                 <div className="grid gap-2"><Label>SKU *</Label><Input value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. BSS-001" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Category *</Label>
                  <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Stock Quantity *</Label><Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Retail Price (₹) *</Label><Input type="number" value={retailPrice} onChange={e => setRetailPrice(e.target.value)} placeholder="0" /></div>
                <div className="grid gap-2"><Label>Wholesale Price (₹) *</Label><Input type="number" value={wholesalePrice} onChange={e => setWholesalePrice(e.target.value)} placeholder="0" /></div>
              </div>
              
              <div className="grid gap-2">
                 <Label>Upload Image (Optional)</Label>
                 <div className="flex items-center gap-4">
                   <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" />
                   {imageUrl && <img src={imageUrl} alt="Preview" className="h-10 w-10 object-cover rounded shadow-sm border" />}
                 </div>
              </div>
              <Button className="mt-2" onClick={handleSaveProduct} disabled={saveProductMutation.isPending}>
                {saveProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Update Product" : "Save Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
             <div className="p-8 text-center text-muted-foreground flex items-center justify-center">
                 <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading products...
             </div>
          ) : (
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
              {filtered.length === 0 ? (
                <tr>
                   <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No products found. Data empty.</td>
                </tr>
              ) : null}
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                         <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex flex-shrink-0">
                           <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                         </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted/50 flex flex-shrink-0 items-center justify-center border border-border">
                           <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                      )}
                      <span className="truncate">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sku}</td>
                  <td className="px-4 py-3"><StatusBadge status="retail" label={p.category} /></td>
                  <td className="px-4 py-3 text-right text-foreground">₹{p.retail_price?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-right text-foreground">₹{p.wholesale_price?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={p.stock <= 10 ? "low" : "ok"} label={(p.stock || 0).toString()} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEditClick(p)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleteProductMutation.isPending} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}
