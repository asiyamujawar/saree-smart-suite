import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "paid" | "pending" | "partial" | "retail" | "wholesale" | "low" | "ok";
  label?: string;
}

const styles: Record<string, string> = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  partial: "bg-info/10 text-info",
  retail: "bg-primary/10 text-primary",
  wholesale: "bg-secondary/10 text-secondary",
  low: "bg-destructive/10 text-destructive",
  ok: "bg-success/10 text-success",
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", styles[status])}>
      {label || status}
    </span>
  );
}
