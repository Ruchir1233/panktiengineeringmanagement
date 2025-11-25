import { supabase } from '@/integrations/supabase/client';
import { Customer, Payment, Employee, Attendance, EmployeeAdvance } from '@/types';

// Helper functions for database operations
export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  
  return (data as any[]).map(customer => {
    const c = customer as any;
    return {
      ...c,
      work_completed: c.work_completed || false,
      referred_by: c.referred_by || null
    };
  }) as Customer[];
};

export const addCustomer = async (customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer | null> => {
  // Remove email from customer data since it doesn't exist in the database
  const { email, ...customerData } = customer;
  
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      ...customerData,
      work_completed: customerData.work_completed || false,
      referred_by: customerData.referred_by || null,
      user_id: '00000000-0000-0000-0000-000000000000' // Set default user_id
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding customer:', error);
    return null;
  }
  
  const c = data as any;
  return {
    ...c,
    work_completed: c.work_completed || false,
    referred_by: c.referred_by || null
  } as Customer;
};

export const getPayments = async (customerId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
  
  // Map the transactions data to match our Payment interface
  return (data || []).map(transaction => ({
    id: transaction.id,
    customer_id: transaction.customer_id,
    amount: transaction.amount,
    payment_mode: transaction.payment_mode,
    notes: transaction.notes,
    created_at: transaction.created_at,
    user_id: transaction.user_id
  }));
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment | null> => {
  // Prepare the payment data for insertion into the transactions table
  const transactionData = {
    customer_id: payment.customer_id,
    amount: payment.amount,
    payment_mode: payment.payment_mode,
    notes: payment.notes,
    user_id: '00000000-0000-0000-0000-000000000000', // Default user ID for now
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert([transactionData])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding payment:', error);
    return null;
  }
  
  // Map the transaction data to match our Payment interface
  return {
    id: data.id,
    customer_id: data.customer_id,
    amount: data.amount,
    payment_mode: data.payment_mode,
    notes: data.notes,
    created_at: data.created_at,
    user_id: data.user_id
  };
};

export const checkPin = async (pin: string): Promise<boolean> => {
  try {
    // Check for development fallback PIN first
    if (pin === '1298') {
      console.log('Using development fallback PIN');
      return true;
    }
    
    // For now, we don't have a settings table in Supabase
    // We'll just use the fallback PIN for testing purposes
    return pin === '1298';
  } catch (err) {
    console.error('Error in PIN verification:', err);
    // For development, allow PIN 1298 as fallback
    return pin === '1298';
  }
};
export const updatePayment = async (paymentId: string, payment: Partial<Payment>): Promise<Payment | null> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({
        amount: payment.amount,
        payment_mode: payment.payment_mode,
        notes: payment.notes
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      return null;
    }

    return {
      id: data.id,
      customer_id: data.customer_id,
      amount: data.amount,
      payment_mode: data.payment_mode,
      notes: data.notes,
      created_at: data.created_at,
      user_id: data.user_id
    };
  } catch (error) {
    console.error('Error updating payment:', error);
    return null;
  }
};

export const deletePayment = async (paymentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('Error deleting payment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting payment:', error);
    return false;
  }
};

export const updateCustomer = async (customerId: string, customer: Partial<Customer>): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: customer.name,
        location: customer.location,
        phone_number: customer.phone_number,
        email: customer.email,
        work_amount: customer.work_amount,
        advance_amount: customer.advance_amount,
        work_completed: customer.work_completed,
        referred_by: customer.referred_by
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return null;
    }

    const c = data as any;
    return {
      ...c,
      work_completed: c.work_completed || false,
      referred_by: c.referred_by || null
    } as Customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    return null;
  }
};

export const deleteCustomer = async (customerId: string): Promise<boolean> => {
  try {
    // First, delete all associated payments
    const { error: paymentsError } = await supabase
      .from('transactions')
      .delete()
      .eq('customer_id', customerId);

    if (paymentsError) {
      console.error('Error deleting customer payments:', paymentsError);
      return false;
    }

    // Then delete the customer
    const { error: customerError } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (customerError) {
      console.error('Error deleting customer:', customerError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting customer:', error);
    return false;
  }
};

// Employee functions
export const getEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase
    .from('employees' as any)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  
  return (data || []) as unknown as Employee[];
};

export const addEmployee = async (employee: Omit<Employee, 'id' | 'created_at'>): Promise<Employee | null> => {
  try {
    const { data, error } = await supabase
      .from('employees' as any)
      .insert([{
        ...employee,
        overtime_rate: employee.overtime_rate || 1.5,
        user_id: '00000000-0000-0000-0000-000000000000'
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding employee:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    return data as unknown as Employee;
  } catch (error: any) {
    console.error('Exception in addEmployee:', error);
    // If table doesn't exist, provide helpful error message
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.error('The employees table does not exist. Please run the migration: 20241001000003_create_employees_table.sql');
    }
    throw error;
  }
};

export const updateEmployee = async (employeeId: string, employee: Partial<Employee>): Promise<Employee | null> => {
  try {
    const { data, error } = await supabase
      .from('employees' as any)
      .update({
        name: employee.name,
        phone_number: employee.phone_number,
        address: employee.address,
        daily_wage: employee.daily_wage,
        overtime_rate: employee.overtime_rate
      })
      .eq('id', employeeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      return null;
    }

    return data as unknown as Employee;
  } catch (error) {
    console.error('Error updating employee:', error);
    return null;
  }
};

export const deleteEmployee = async (employeeId: string): Promise<boolean> => {
  try {
    // First, delete all associated attendance records
    const { error: attendanceError } = await supabase
      .from('attendance' as any)
      .delete()
      .eq('employee_id', employeeId);

    if (attendanceError) {
      console.error('Error deleting employee attendance:', attendanceError);
      return false;
    }

    // Then delete the employee
    const { error: employeeError } = await supabase
      .from('employees' as any)
      .delete()
      .eq('id', employeeId);

    if (employeeError) {
      console.error('Error deleting employee:', employeeError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting employee:', error);
    return false;
  }
};

// Attendance functions
export const getAttendance = async (employeeId?: string, month?: number, year?: number): Promise<Attendance[]> => {
  let query = supabase
    .from('attendance' as any)
    .select('*')
    .order('date', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    query = query.gte('date', startDate).lte('date', endDate);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
  
  return (data || []) as unknown as Attendance[];
};

export const getAttendanceByDate = async (date: string): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance' as any)
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching attendance by date:', error);
    return [];
  }
  
  return (data || []) as unknown as Attendance[];
};

export const addAttendance = async (attendance: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance | null> => {
  const { data, error } = await supabase
    .from('attendance' as any)
    .insert([{
      ...attendance,
      user_id: '00000000-0000-0000-0000-000000000000'
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding attendance:', error);
    return null;
  }
  
  return (data as unknown) as Attendance;
};

export const updateAttendance = async (attendanceId: string, attendance: Partial<Attendance>): Promise<Attendance | null> => {
  try {
    const { data, error } = await supabase
      .from('attendance' as any)
      .update({
        attendance_type: attendance.attendance_type,
        hours: attendance.hours
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating attendance:', error);
      return null;
    }

    return (data as unknown) as Attendance;
  } catch (error) {
    console.error('Error updating attendance:', error);
    return null;
  }
};

export const deleteAttendance = async (attendanceId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('attendance' as any)
      .delete()
      .eq('id', attendanceId);

    if (error) {
      console.error('Error deleting attendance:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return false;
  }
};

// Employee advances functions
export const getEmployeeAdvances = async (): Promise<EmployeeAdvance[]> => {
  const { data, error } = await supabase
    .from('employee_advances' as any)
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching employee advances:', error);
    return [];
  }

  return (data || []) as unknown as EmployeeAdvance[];
};

export const addEmployeeAdvance = async (advance: Omit<EmployeeAdvance, 'id' | 'created_at'>): Promise<EmployeeAdvance | null> => {
  const { data, error } = await supabase
    .from('employee_advances' as any)
    .insert([{
      ...advance,
      user_id: '00000000-0000-0000-0000-000000000000'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error recording advance:', error);
    return null;
  }

  return data as unknown as EmployeeAdvance;
};

