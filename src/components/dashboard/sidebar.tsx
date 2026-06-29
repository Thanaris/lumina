"use client";

import Image from "next/image";
import { LayoutDashboard, ShoppingBag, Star, Share2, UtensilsCrossed, CalendarDays, Settings, Menu, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

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

  // Chiudi sidebar al resize su desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Blocca scroll del body quando sidebar è aperta su mobile
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleNav = (id: string) => {
    onSectionChange(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Hamburger button — grande per touch, con sfondo solido */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden bg-lumina-dark/95 backdrop-blur-md shadow-lg border border-lumina-border/50 text-white h-11 w-11 active:scale-95 transition-transform"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu di navigazione"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay scuro — tocca per chiudere */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-lumina-dark border-r border-lumina-border flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo — con contorno dorato per visibilità su sfondo nero */}
        <div className="p-4 md:p-5 border-b border-lumina-border">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-lumina-gold/60 to-lumina-gold-dark/60 rounded-xl blur-[2px] opacity-70" />
              <Image
                src="/logo.png"
                alt="Lumina"
                width={44}
                height={44}
                className="relative rounded-xl ring-2 ring-lumina-gold/40"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg leading-tight text-white tracking-wide">LUMINA</h1>
              <p className="text-[10px] md:text-[11px] text-lumina-gold font-medium tracking-wider truncate">
                L&apos;ASSISTENTE AI PER RISTORANTI
              </p>
            </div>
          </div>
        </div>

        {/* Navigazione — touch targets grandi su mobile */}
        <nav className="flex-1 p-2 md:p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? "bg-lumina-gold/15 text-lumina-gold border border-lumina-gold/30"
                    : "text-gray-400 hover:bg-lumina-border/50 hover:text-white border border-transparent"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] md:h-4 md:w-4 ${isActive ? "text-lumina-gold" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer — AI attivo */}
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
