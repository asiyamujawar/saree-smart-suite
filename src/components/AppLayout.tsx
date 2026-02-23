import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Inventory", icon: Warehouse, path: "/inventory" },
  { label: "Billing", icon: FileText, path: "/billing" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-gold">
            <span className="font-display text-sm font-bold text-sidebar-primary-foreground">M</span>
          </div>
          <div>
            <h1 className="font-display text-base font-semibold text-sidebar-foreground">Mangalmurti</h1>
            <p className="text-[11px] text-sidebar-foreground/60">Saree Management</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-sidebar-foreground/70">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-primary">
              AD
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">Admin</p>
              <p className="text-[11px] text-sidebar-foreground/50">admin@mangalmurti.com</p>
            </div>
            <LogOut className="h-4 w-4 text-sidebar-foreground/50" />
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-md px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products, customers..."
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
