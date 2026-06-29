import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  Flower2,
  LayoutDashboard,
  Package,
  PackagePlus,
  Settings,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import type { ReactNode } from "react";

const navItems: ReadonlyArray<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/receive", label: "Receive", icon: PackagePlus },
  { to: "/orders", label: "Order", icon: ClipboardList },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Flower2 className="h-6 w-6 text-primary" />
            <span>Petal Inventory</span>
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItems.map(({ to, label, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: exact ?? false }}
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
