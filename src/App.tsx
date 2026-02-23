import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
          <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
          <Route path="/billing" element={<AppLayout><Billing /></AppLayout>} />
          <Route path="/customers" element={<AppLayout><Customers /></AppLayout>} />
          <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
