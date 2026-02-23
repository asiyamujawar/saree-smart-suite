import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl gradient-gold">
            <span className="font-display text-xl font-bold text-accent-foreground">M</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Mangalmurti Sarees</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" placeholder="admin@mangalmurti.com" defaultValue="admin@mangalmurti.com" />
          </div>
          <div className="grid gap-2">
            <Label>Password</Label>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Enter password" defaultValue="admin123" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">Demo credentials pre-filled</p>
      </div>
    </div>
  );
}
