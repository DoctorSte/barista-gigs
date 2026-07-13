import {
  ANNOUNCEMENT_STATUSES,
  INTEREST_STATUSES,
  PAY_TYPES,
  USER_ROLES,
} from "./constants";

export type UserRole = (typeof USER_ROLES)[number];
export type AnnouncementStatus = (typeof ANNOUNCEMENT_STATUSES)[number];
export type InterestStatus = (typeof INTEREST_STATUSES)[number];
export type PayType = (typeof PAY_TYPES)[number];

export type WeeklySlot = {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  start: string;
  end: string;
};

export type Availability = {
  weekly: WeeklySlot[];
  blackoutDates: string[];
};

export type City = {
  id: string;
  slug: string;
  name: string;
  country_code: string;
  timezone: string;
  is_active: boolean;
};

export type Profile = {
  id: string;
  role: UserRole;
  display_name: string;
  city_id: string;
  avatar_url: string | null;
  created_at: string;
};

export type CoffeeShop = {
  id: string;
  owner_id: string;
  city_id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  machines: string[];
  description: string | null;
  website: string | null;
  phone: string | null;
  is_published: boolean;
};

export type ExtraProfile = {
  id: string;
  user_id: string;
  city_id: string;
  bio: string | null;
  years_experience: number | null;
  hourly_rate_cents: number | null;
  currency: string;
  availability: Availability;
  skills: string[];
  is_available: boolean;
};

export type Announcement = {
  id: string;
  shop_id: string;
  city_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  pay_rate_cents: number;
  pay_type: PayType;
  required_skills: string[];
  status: AnnouncementStatus;
  created_at: string;
};

export type Interest = {
  id: string;
  announcement_id: string;
  extra_id: string;
  message: string;
  status: InterestStatus;
  created_at: string;
};

export type Conversation = {
  id: string;
  announcement_id: string;
  shop_id: string;
  extra_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Subscription = {
  shop_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
};
