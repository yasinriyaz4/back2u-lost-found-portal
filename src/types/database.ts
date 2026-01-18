export type ItemCategory = 'lost' | 'found';
export type ItemStatus = 'active' | 'claimed' | 'resolved';
export type AppRole = 'admin' | 'moderator' | 'user';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  email_notifications?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: ItemCategory;
  location: string;
  item_date: string;
  image_url: string | null;
  image_urls: string[];
  contact_number: string | null;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Message {
  id: string;
  from_user_id: string;
  to_user_id: string;
  item_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  from_profile?: Profile;
  to_profile?: Profile;
  item?: Item;
}

export interface Report {
  id: string;
  reporter_id: string;
  item_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter?: Profile;
  item?: Item;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'match' | 'message' | 'status_change';
  title: string;
  message: string;
  item_id?: string | null;
  related_item_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ItemMatch {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  match_score: number;
  match_reason?: string | null;
  status: 'pending' | 'confirmed' | 'dismissed';
  created_at: string;
  lost_item?: Item;
  found_item?: Item;
}
