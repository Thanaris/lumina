"use client";

import Image from "next/image";
import { LayoutDashboard, ShoppingBag, Star, Share2, UtensilsCrossed, CalendarDays, Settings, Menu, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat Clienti", icon: MessageCircle },
  { id: "ordini", label: "Comande Cucina", icon: ShoppingBag },
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
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden bg-lumina-dark/90 backdrop-blur shadow-sm text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/70 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-lumina-dark border-r border-lumina-border flex flex-col transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-lumina-border">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Lumina" width={40} height={40} className="rounded-lg" />
            <div>
              <h1 className="font-bold text-lg leading-tight text-white tracking-wide">LUMINA</h1>
              <p className="text-[11px] text-lumina-gold font-medium tracking-wider">L&apos;ASSISTENTE AI PER RISTORANTI</p>
            </div>
          </div>
        </div>

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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-lumina-gold/15 text-lumina-gold border border-lumina-gold/30"
                    : "text-gray-400 hover:bg-lumina-border/50 hover:text-white border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-lumina-gold" : ""}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-lumina-border">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-lumina-gold animate-pulse" />
            <span className="text-xs text-lumina-gold font-medium">AI Attivo</span>
          </div>
          <p className="text-[10px] text-gray-600">Lumina v1.0</p>
        </div>
      </aside>
    </>
  );
}
