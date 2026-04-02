import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Billing from "./pages/Billing";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Only allow authenticated users
const ProtectedRoute = ({ isAuth }: { isAuth: boolean }) => {
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const App = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem("mangalmurtiAdmin");
    setIsAuth(authStatus === "true");
    setTimeout(() => setIsCheckingAuth(false), 2000); 
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-white transition-opacity duration-1000">
        <div className="flex flex-col items-center animate-pulse">
           <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
              <span className="text-primary text-5xl font-serif italic text-shadow-glow">M</span>
           </div>
           <h1 className="font-display text-4xl font-bold tracking-tight mb-2">Mangalmurti Sarees</h1>
           <p className="text-zinc-500 text-xs tracking-[0.3em] font-medium uppercase mt-2 border-t border-zinc-800 pt-3">Initializing Secure System...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={isAuth ? <Navigate to="/" replace /> : <Login />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute isAuth={isAuth} />}>
              <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
              <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
              <Route path="/billing" element={<AppLayout><Billing /></AppLayout>} />
              <Route path="/customers" element={<AppLayout><Customers /></AppLayout>} />
              <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
              <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
