export interface Member {
  id: string;
  branch_id: string;
  branch_name?: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  membership_type: string;
  membership_start: string;
  membership_end: string;
  photo_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Trainer {
  id: string;
  branch_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  gender?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PTRegistration {
  id: string;
  branch_id: string;
  member_id: string;
  member_name: string;
  member_username?: string;
  trainer_id: string;
  trainer_name: string;
  registration_date: string;
  package_name: string;
  payment_method: string;
  total_amount: number;
  notes?: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  branch_id: string;
  transaction_number: string;
  member_id?: string;
  member_name?: string;
  admin_id: string;
  admin_name: string;
  transaction_date: string;
  total_amount: number;
  notes?: string;
  items?: TransactionItem[];
  created_at?: string;
}

export interface CardReplacementLog {
  id: string;
  transaction_number: string;
  date: string;
  member_id: string;
  member_name: string;
  old_username: string;
  new_username: string;
  reason: string;
  fee: number;
  admin_name: string;
}

export interface Checkin {
  id: string;
  member_id: string;
  member_name?: string;
  member_code?: string;
  branch_id: string;
  branch_name?: string;
  check_in_at: string;
  check_out_at?: string;
  duration_minutes?: number;
  status: string;
  created_at?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

export interface Admin {
  id: string;
  branch_id: string;
  branch_name?: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: 'owner' | 'karyawan';
  is_active: boolean;
  work_start_time?: string;
  created_at?: string;
}

export interface Distributor {
  id: string;
  branch_id?: string;
  name: string;
  phone_hp?: string;
  phone_telp?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}
