export type CMSTab = 'promo' | 'membership' | 'pt';

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
