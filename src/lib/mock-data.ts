// Mock data for the Mangalmurti Saree Management System

export interface Product {
  id: string;
  name: string;
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  image: string;
  sku: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: "retail" | "wholesale";
  totalPurchases: number;
  outstanding: number;
  lastPurchase: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customer: string;
  date: string;
  items: number;
  total: number;
  gst: number;
  grandTotal: number;
  paymentMethod: "cash" | "upi" | "card";
  status: "paid" | "pending" | "partial";
  type: "retail" | "wholesale";
}

export interface SalesData {
  month: string;
  retail: number;
  wholesale: number;
}

export const products: Product[] = [
  { id: "1", name: "Banarasi Silk Saree", category: "Silk", retailPrice: 8500, wholesalePrice: 6200, stock: 24, image: "", sku: "BSS-001" },
  { id: "2", name: "Kanjeevaram Gold Border", category: "Silk", retailPrice: 12000, wholesalePrice: 9000, stock: 12, image: "", sku: "KGB-002" },
  { id: "3", name: "Cotton Handloom Saree", category: "Cotton", retailPrice: 2500, wholesalePrice: 1800, stock: 45, image: "", sku: "CHS-003" },
  { id: "4", name: "Chiffon Printed Saree", category: "Chiffon", retailPrice: 3200, wholesalePrice: 2200, stock: 38, image: "", sku: "CPS-004" },
  { id: "5", name: "Georgette Party Wear", category: "Georgette", retailPrice: 5500, wholesalePrice: 4000, stock: 18, image: "", sku: "GPW-005" },
  { id: "6", name: "Paithani Silk Saree", category: "Silk", retailPrice: 15000, wholesalePrice: 11500, stock: 8, image: "", sku: "PSS-006" },
  { id: "7", name: "Linen Summer Saree", category: "Linen", retailPrice: 3800, wholesalePrice: 2800, stock: 30, image: "", sku: "LSS-007" },
  { id: "8", name: "Tussar Silk Embroidered", category: "Silk", retailPrice: 7200, wholesalePrice: 5400, stock: 5, image: "", sku: "TSE-008" },
];

export const customers: Customer[] = [
  { id: "1", name: "Priya Sharma", phone: "9876543210", email: "priya@email.com", type: "retail", totalPurchases: 45000, outstanding: 0, lastPurchase: "2026-02-20" },
  { id: "2", name: "Rajesh Textiles", phone: "9123456789", email: "rajesh@textiles.com", type: "wholesale", totalPurchases: 350000, outstanding: 25000, lastPurchase: "2026-02-18" },
  { id: "3", name: "Meena Devi", phone: "9988776655", email: "meena@email.com", type: "retail", totalPurchases: 18000, outstanding: 3200, lastPurchase: "2026-02-15" },
  { id: "4", name: "Lakshmi Silk House", phone: "9112233445", email: "lakshmi@silkhouse.com", type: "wholesale", totalPurchases: 580000, outstanding: 48000, lastPurchase: "2026-02-22" },
  { id: "5", name: "Anita Verma", phone: "9556677889", email: "anita@email.com", type: "retail", totalPurchases: 22000, outstanding: 0, lastPurchase: "2026-02-10" },
];

export const invoices: Invoice[] = [
  { id: "1", invoiceNo: "INV-2026-001", customer: "Priya Sharma", date: "2026-02-20", items: 3, total: 18500, gst: 2775, grandTotal: 21275, paymentMethod: "upi", status: "paid", type: "retail" },
  { id: "2", invoiceNo: "INV-2026-002", customer: "Rajesh Textiles", date: "2026-02-18", items: 15, total: 85000, gst: 12750, grandTotal: 97750, paymentMethod: "card", status: "pending", type: "wholesale" },
  { id: "3", invoiceNo: "INV-2026-003", customer: "Meena Devi", date: "2026-02-15", items: 2, total: 6700, gst: 1005, grandTotal: 7705, paymentMethod: "cash", status: "paid", type: "retail" },
  { id: "4", invoiceNo: "INV-2026-004", customer: "Lakshmi Silk House", date: "2026-02-22", items: 25, total: 145000, gst: 21750, grandTotal: 166750, paymentMethod: "upi", status: "partial", type: "wholesale" },
  { id: "5", invoiceNo: "INV-2026-005", customer: "Anita Verma", date: "2026-02-10", items: 1, total: 8500, gst: 1275, grandTotal: 9775, paymentMethod: "cash", status: "paid", type: "retail" },
];

export const salesData: SalesData[] = [
  { month: "Sep", retail: 120000, wholesale: 280000 },
  { month: "Oct", retail: 185000, wholesale: 420000 },
  { month: "Nov", retail: 210000, wholesale: 350000 },
  { month: "Dec", retail: 290000, wholesale: 510000 },
  { month: "Jan", retail: 175000, wholesale: 380000 },
  { month: "Feb", retail: 245000, wholesale: 460000 },
];

export const categories = ["Silk", "Cotton", "Chiffon", "Georgette", "Linen", "Tussar"];

export const dashboardStats = {
  totalRevenue: 1225000,
  todaySales: 48500,
  totalProducts: 180,
  lowStock: 3,
  totalCustomers: 156,
  pendingPayments: 76200,
};
