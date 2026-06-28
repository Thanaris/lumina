'use client';

import { useState } from 'react';
import { AppSidebar } from '@/components/dashboard/sidebar';
import DashboardHome from '@/components/dashboard/dashboard-home';
import OrdersSection from '@/components/dashboard/orders-section';
import WhatsAppSection from '@/components/dashboard/whatsapp-section';
import ReviewsSection from '@/components/dashboard/reviews-section';
import SocialSection from '@/components/dashboard/social-section';
import MenuSection from '@/components/dashboard/menu-section';
import ReservationsSection from '@/components/dashboard/reservations-section';
import SettingsSection from '@/components/dashboard/settings-section';

const sections: Record<string, React.ComponentType> = {
  dashboard: DashboardHome,
  chat: WhatsAppSection,
  ordini: OrdersSection,
  recensioni: ReviewsSection,
  social: SocialSection,
  menu: MenuSection,
  prenotazioni: ReservationsSection,
  impostazioni: SettingsSection,
};

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const ActiveComponent = sections[activeSection] || DashboardHome;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 md:ml-64 p-4 md:p-6 lg:p-8">
        <ActiveComponent />
      </main>
    </div>
  );
}