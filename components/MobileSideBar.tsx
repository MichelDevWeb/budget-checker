"use client";

import { Menu, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/nav-config";
import { useTheme } from "next-themes";
import { UserButton } from "@clerk/nextjs";

export default function MobileSideBar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed left-2 bottom-2 z-30 rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-all duration-300",
          isOpen ? "opacity-0" : "opacity-100"
        )}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 z-40 h-[80vh] w-64 transform bg-background transition-transform duration-300 ease-in-out shadow-lg rounded-tr-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col p-4">
          {/* Main Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="space-y-4 border-t py-4">
            {/* Account Management */}
            <div className="flex items-center gap-2 px-2">
              <UserButton />

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 "
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <>
                    <Sun size={20} className="text-yellow-500" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={20} className="text-slate-700" />
                    <span>Dark Mode</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
