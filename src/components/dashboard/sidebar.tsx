"use client";

import { LayoutDashboard, ShoppingBag, Star, Share2, UtensilsCrossed, CalendarDays, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "ordini", label: "Ordini WhatsApp", icon: ShoppingBag },
  { id: "recensioni", label: "Recensioni AI", icon: Star },
  { id: "social", label: "Social Media", icon: Share2 },
  { id: "menu", label: "Menu Digitale", icon: UtensilsCrossed },
  { id: "prenotazioni", label: "Prenotazioni", icon: CalendarDays },
  { id: "impostazioni", label: "Impostazioni", icon: Settings },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function AppSidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden bg-white/90 backdrop-blur shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-gray-900 text-white flex flex-col transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">☀️</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">Lumina</h1>
              <p className="text-xs text-gray-400">Assistant per Ristoranti</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-emerald-600 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400">AI Attivo</span>
          </div>
          <p className="text-[10px] text-gray-500">Lumina v1.0 · Sicilia 🇮🇹</p>
        </div>
      </aside>
    </>
  );
}