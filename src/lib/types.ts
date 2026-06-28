export interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  tiktok: string;
  description: string;
  logoUrl: string;
  coverUrl: string;
  tables: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  allergens: string;
  imageEmoji: string;
  sortOrder: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  notes: string;
  price: number;
  menuItemId: string;
  menuItem?: { name: string; imageEmoji: string };
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  status: "nuovo" | "in_cucina" | "pronto" | "consegnato" | "annullato";
  total: number;
  notes: string;
  source: string;
  createdAt: string;
  items: OrderItem[];
}

export interface Review {
  id: string;
  platform: "google" | "tripadvisor" | "thefork";
  author: string;
  rating: number;
  text: string;
  date: string;
  replied: boolean;
  replyText: string;
  replyDate: string;
}

export interface SocialPost {
  id: string;
  platform: "instagram" | "tiktok" | "facebook";
  type: "foto" | "video" | "storia" | "reel";
  caption: string;
  scheduledAt: string;
  status: "bozza" | "programmato" | "pubblicato" | "fallito";
  aiSuggestion: boolean;
  hashtags: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  guests: number;
  notes: string;
  status: "confermata" | "in_attesa" | "completata" | "annullata";
}