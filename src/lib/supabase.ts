import { supabase } from '@/integrations/supabase/client';
import { Customer, Payment } from '@/types';

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
  
  return data.map(customer => ({
    ...customer,
    work_completed: customer.work_completed || false
  })) as Customer[];
};

export const addCustomer = async (customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer | null> => {
  // Remove email from customer data since it doesn't exist in the database
  const { email, ...customerData } = customer;
  
  const { data, error } = await supabase
    .from('customers')
    .insert([{
      ...customerData,
      work_completed: customerData.work_completed || false,
      user_id: '00000000-0000-0000-0000-000000000000' // Set default user_id
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding customer:', error);
    return null;
  }
  
  return {
    ...data,
    work_completed: data.work_completed || false
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
        work_completed: customer.work_completed
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return null;
    }

    return {
      ...data,
      work_completed: data.work_completed || false
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

