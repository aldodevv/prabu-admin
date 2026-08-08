export type CMSTab = 'promo' | 'membership' | 'pt' | 'hub';

export interface MembershipPlanItem {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  original_price?: number;
  badge?: string;
  popular?: boolean;
  bonus_text?: string;
  discount_badge?: string;
  tagline?: string;
  features?: string[];
  featuresStr?: string;
}

export interface PTPlanItem {
  id: string;
  name: string;
  duration_days: number;
  session_count: number;
  price: number;
  original_price?: number;
  badge?: string;
  popular?: boolean;
  bonus_text?: string;
  discount_badge?: string;
  tagline?: string;
  features?: string[];
  featuresStr?: string;
}

export interface HubCardItem {
  id: string;
  title: string;
  category: 'downloads' | 'videos' | 'exclusive' | 'merchandise';
  categoryLabel: string;
  badge: string;
  price: string;
  originalPrice?: string;
  isFree: boolean;
  isMemberOnly: boolean;
  description: string;
  image: string;
  actionType: 'download' | 'video' | 'whatsapp' | 'claim';
  format?: string;
  rating: string;
  stats: string;
  highlights: string[];
  sortOrder: number;
  isActive: boolean;
}
