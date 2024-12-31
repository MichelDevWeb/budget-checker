import { LayoutDashboard, PiggyBank, Receipt, Settings } from "lucide-react";

export const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: Receipt,
  },
  {
    href: "/savings",
    label: "Savings",
    icon: PiggyBank,
  },
  {
    href: "/manage",
    label: "Manage",
    icon: Settings,
  },
] as const;
