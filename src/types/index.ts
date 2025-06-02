export interface Customer {
  id: string;
  name: string;
  address: string | null;
  email?: string; // Made optional to match the database schema
  phone_number: string | null;
  location: string | null;
  work_amount: number;
  advance_amount: number;
  work_completed: boolean;
  created_at: string;
  user_id?: string; // Added to match database schema
}

export interface Payment {
  id: string;
  customer_id: string;
  amount: number;
  payment_mode: string;
  notes?: string | null;
  created_at: string;
  user_id?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
}
