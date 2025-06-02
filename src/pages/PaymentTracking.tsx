import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Customer, Payment } from '@/types';
import { addPayment, getCustomers, getPayments, deletePayment } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import PaymentEntry from '@/components/PaymentEntry';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const PaymentTracking = () => {
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId');
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortByBalanceDue, setSortByBalanceDue] = useState<'desc' | 'asc'>('desc');
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_mode: 'cash',
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  
  const lastViewedCustomerRef = useRef<HTMLDivElement>(null);
  const [lastViewedCustomerId, setLastViewedCustomerId] = useState<string | null>(() => {
    return localStorage.getItem('lastViewedCustomerId');
  });
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const customersData = await getCustomers();
        setCustomers(customersData);
        
        if (customerId) {
          const foundCustomer = customersData.find(c => c.id === customerId);
          if (foundCustomer) {
            setCustomer(foundCustomer);
            const paymentsData = await getPayments(foundCustomer.id);
            setPayments(paymentsData);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [customerId]);
  
  useEffect(() => {
    if (!customerId && lastViewedCustomerRef.current) {
      lastViewedCustomerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [customerId]);
  
  const handleCustomerSelect = async (selectedCustomerId: string) => {
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
    if (selectedCustomer) {
      setCustomer(selectedCustomer);
      setLastViewedCustomerId(selectedCustomerId);
      localStorage.setItem('lastViewedCustomerId', selectedCustomerId);
      const paymentsData = await getPayments(selectedCustomer.id);
      setPayments(paymentsData);
      navigate(`/payment-tracking?customerId=${selectedCustomer.id}`);
    }
  };
  
  const handlePaymentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePaymentModeChange = (value: string) => {
    setPaymentForm(prev => ({ ...prev, payment_mode: value }));
  };
  
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer) return;
    
    try {
      const amount = parseFloat(paymentForm.amount);
      
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      const paymentData = {
        customer_id: customer.id,
        amount,
        payment_mode: paymentForm.payment_mode,
        notes: paymentForm.notes || null,
        created_at: paymentForm.date ? new Date(paymentForm.date).toISOString() : undefined,
      };
      
      const result = await addPayment(paymentData);
      
      if (result) {
        toast.success('Payment added successfully');
        setPayments(prev => [result, ...prev]);
        setDialogOpen(false);
        setPaymentForm({
          amount: '',
          payment_mode: 'cash',
          notes: '',
          date: format(new Date(), 'yyyy-MM-dd'),
        });
      } else {
        toast.error('Failed to add payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('An error occurred while adding the payment');
    }
  };
  
  const handleUpdatePayment = async (updatedPayment: Payment) => {
    try {
      setPayments(prev => 
        prev.map(p => p.id === updatedPayment.id ? updatedPayment : p)
      );
      toast.success('Payment updated successfully');
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('An error occurred while updating the payment');
    }
  };
  
  const handleDeletePayment = async (paymentId: string) => {
    try {
      const success = await deletePayment(paymentId);
      if (success) {
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        toast.success('Payment deleted successfully');
      } else {
        toast.error('Failed to delete payment');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('An error occurred while deleting the payment');
    }
  };
  
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = customer ? customer.work_amount - customer.advance_amount - totalPaid : 0;
  
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone_number.includes(searchTerm) ||
    c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getCustomerPaymentInfo = (customer: Customer) => {
    const totalPaid = customer.advance_amount;
    const pendingAmount = customer.work_amount - totalPaid;
    return { totalPaid, pendingAmount };
  };
  
  const filteredAndSortedCustomers = (() => {
    const customersWithPending = filteredCustomers.map(c => {
      const { pendingAmount } = getCustomerPaymentInfo(c);
      return { ...c, pendingAmount };
    });
    let result = customersWithPending;
    if (filter === 'pending') {
      result = result.filter(c => c.pendingAmount > 0);
    } else if (filter === 'completed') {
      result = result.filter(c => c.pendingAmount === 0);
    }
    if (filter === 'all') {
      result = result.sort((a, b) => {
        if (a.pendingAmount === 0 && b.pendingAmount > 0) return 1;
        if (a.pendingAmount > 0 && b.pendingAmount === 0) return -1;
        return 0;
      });
    }
    if (sortByBalanceDue === 'desc') {
      result = result.sort((a, b) => b.pendingAmount - a.pendingAmount);
    } else {
      result = result.sort((a, b) => a.pendingAmount - b.pendingAmount);
    }
    return result;
  })();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background animate-fade-in">
        <Navbar />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }
  
  if (!customerId) {
    return (
      <div className="min-h-screen flex flex-col bg-background animate-fade-in">
        <Navbar />
        <main className="flex-1 container py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">Select Customer</h1>
                <p className="text-muted-foreground">Choose a customer to view or add payments</p>
              </div>
              <Button
                variant="ghost"
                className="gap-1"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
            </div>
            
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, phone or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="mb-4 flex gap-2">
              <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
              <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
              <Button variant={filter === 'completed' ? 'default' : 'outline'} onClick={() => setFilter('completed')}>Completed</Button>
            </div>
            
            <div className="space-y-4">
              {filteredAndSortedCustomers.map((c) => {
                const { pendingAmount } = getCustomerPaymentInfo(c);
                return (
                  <Card 
                    key={c.id}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleCustomerSelect(c.id)}
                    ref={c.id === lastViewedCustomerId ? lastViewedCustomerRef : null}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{c.name}</h3>
                          <p className="text-sm text-muted-foreground">{c.location}</p>
                          <p className="text-sm text-muted-foreground mt-1">{c.phone_number}</p>
                        </div>
                        <div className="text-right">
                          <div className="mb-2">
                            <p className="text-sm text-muted-foreground">Work Amount</p>
                            <p className="font-medium">₹{c.work_amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Pending</p>
                            <p className={`font-medium ${pendingAmount > 0 ? 'text-destructive' : 'text-green-500'}`}>
                              ₹{pendingAmount.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {filteredAndSortedCustomers.length === 0 && (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">No customers found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'Try a different search term' : 'Add your first customer to get started'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => navigate('/add-customer')}>
                      Add Customer
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="min-h-screen flex flex-col bg-background animate-fade-in">
        <Navbar />
        <main className="flex-1 container py-8 flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium mb-2">Customer not found</h3>
          <p className="text-muted-foreground mb-4">The selected customer could not be found</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background animate-fade-in">
      <Navbar />
      
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 gap-1"
            onClick={() => navigate('/payment-tracking')}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Customers
          </Button>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">{customer.name}</h1>
              <p className="text-muted-foreground">Payment History</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto pb-32 sm:pb-8">
                <DialogHeader>
                  <DialogTitle>Add New Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddPayment} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="Enter payment amount"
                      value={paymentForm.amount}
                      onChange={handlePaymentFormChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={paymentForm.date}
                        onChange={handlePaymentFormChange}
                        required
                      />
                      <Button type="button" onClick={() => setPaymentForm(prev => ({ ...prev, date: format(new Date(), 'yyyy-MM-dd') }))}>
                        Today
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment_mode">Payment Mode</Label>
                    <Select
                      value={paymentForm.payment_mode}
                      onValueChange={handlePaymentModeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Add any notes about the payment"
                      value={paymentForm.notes}
                      onChange={handlePaymentFormChange}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Payment</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={() => setSortByBalanceDue(sortByBalanceDue === 'desc' ? 'asc' : 'desc')}
          >
            Sort by Balance Due: {sortByBalanceDue === 'desc' ? 'High → Low' : 'Low → High'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Work Amount</p>
            <p className="text-2xl font-bold">₹{customer.work_amount.toLocaleString()}</p>
          </Card>
          
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold text-green-500">₹{totalPaid.toLocaleString()}</p>
          </Card>
          
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Balance Due</p>
            <p className={`text-2xl font-bold ${pendingAmount > 0 ? 'text-destructive' : 'text-green-500'}`}>
              ₹{pendingAmount.toLocaleString()}
            </p>
          </Card>
        </div>
        
        <div className="space-y-4">
          {payments.length > 0 ? (
            payments.map((payment) => (
              <PaymentEntry
                key={payment.id}
                payment={payment}
                onUpdate={handleUpdatePayment}
                onDelete={handleDeletePayment}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No payments yet</h3>
              <p className="text-muted-foreground mb-4">Add your first payment to get started</p>
              <Button onClick={() => setDialogOpen(true)}>Add Payment</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentTracking;
