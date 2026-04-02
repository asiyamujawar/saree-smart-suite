import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      // Hardcoded Admin Credentials
      if (email === "admin@mangalmurti.com" && password === "admin123") {
        localStorage.setItem("mangalmurtiAdmin", "true");
        window.location.href = "/";
      } else {
        toast.error("Invalid credentials", { description: "Please use admin@mangalmurti.com and admin123" });
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative z-10 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl gradient-gold shadow-lg shadow-primary/20">
            <span className="font-display text-xl font-bold text-accent-foreground">M</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Mangalmurti Sarees</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to securely manage your store</p>
        </div>

        <form onSubmit={handleAuth} className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-2xl space-y-5">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@mangalmurti.com" />
          </div>
          <div className="grid gap-2">
            <Label>Password</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="admin123" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full shadow-md mt-2">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">Security enforced locally</p>
        </form>
      </div>
    </div>
  );
}
