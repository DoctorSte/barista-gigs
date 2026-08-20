// Hand-maintained mirror of supabase/migrations. Regenerate with
// `supabase gen types typescript` once the project is reachable.

export type Role = "shop" | "extra";
export type PayType = "hourly" | "flat";
export type AnnouncementStatus = "draft" | "open" | "filled" | "closed";
export type InterestStatus = "pending" | "accepted" | "declined";

export type Availability = {
  weekly: number[]; // days of week, 0 = Monday … 6 = Sunday
  blackoutDates: string[]; // ISO dates
};

export type City = {
  id: string;
  slug: string;
  name: string;
  country_code: string;
  timezone: string;
  is_active: boolean;
  lat: number | null;
  lng: number | null;
  source: "curated" | "search";
  is_featured: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  role: Role;
  display_name: string;
  city_id: string;
  avatar_url: string | null;
  created_at: string;
};

export type Machine = {
  type: "espresso_machine" | "grinder" | "brewer" | "roaster" | "other";
  name: string;
};

export type CoffeeShop = {
  id: string;
  owner_id: string;
  city_id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  machines: Machine[];
  description: string | null;
  website: string | null;
  phone: string | null;
  is_published: boolean;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RateCard = {
  label: string;
  cents: number;
};

export type ExtraProfile = {
  id: string;
  user_id: string;
  city_id: string;
  bio: string | null;
  years_experience: number | null;
  hourly_rate_cents: number | null;
  currency: string;
  rates: RateCard[];
  signature_drink: string | null;
  instagram_handle: string | null;
  availability: Availability;
  skills: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type Recommendation = {
  id: string;
  shop_id: string;
  extra_id: string;
  comment: string | null;
  created_at: string;
};

export type PortfolioPhoto = {
  id: string;
  extra_id: string;
  storage_path: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

export type GigShift = {
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
};

export type Announcement = {
  id: string;
  shop_id: string;
  city_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  shifts: GigShift[];
  pay_rate_cents: number;
  pay_type: PayType;
  required_skills: string[];
  status: AnnouncementStatus;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  shop_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: string | null;
  updated_at: string;
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
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type ExtraPaymentDetails = {
  extra_id: string;
  details: string;
  updated_at: string;
};

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      cities: Table<City, "slug" | "name">;
      profiles: Table<Profile, "id" | "role" | "display_name" | "city_id">;
      coffee_shops: Table<CoffeeShop, "owner_id" | "city_id" | "name" | "address">;
      extras_profiles: Table<ExtraProfile, "user_id" | "city_id">;
      portfolio_photos: Table<PortfolioPhoto, "extra_id" | "storage_path">;
      announcements: Table<Announcement, "shop_id" | "city_id" | "title" | "description" | "starts_at" | "ends_at" | "pay_rate_cents" | "pay_type">;
      subscriptions: Table<Subscription, "shop_id">;
      interests: Table<Interest, "announcement_id" | "extra_id" | "message">;
      recommendations: Table<Recommendation, "shop_id" | "extra_id">;
      notifications: Table<Notification, "user_id" | "type" | "title">;
      extras_payment_details: Table<ExtraPaymentDetails, "extra_id">;
      conversations: Table<Conversation, "announcement_id" | "shop_id" | "extra_id">;
      messages: Table<Message, "conversation_id" | "sender_id" | "body">;
    };
    Views: Record<string, never>;
    Functions: {
      current_profile_city_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
