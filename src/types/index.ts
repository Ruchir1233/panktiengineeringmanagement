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

export interface Employee {
  id: string;
  name: string;
  phone_number: string | null;
  address: string | null;
  daily_wage: number;
  overtime_rate: number;
  created_at: string;
  user_id?: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  attendance_type: 'full_day' | 'half_day' | 'hourly' | 'absent' | 'ot_day';
  hours?: number | null;
  created_at: string;
  user_id?: string;
}
