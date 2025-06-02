import { useEffect, useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import CustomerCard from '@/components/CustomerCard';
import { Customer, Payment } from '@/types';
import { getCustomers, getPayments } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, DollarSign, Clock, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

const Dashboard = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | undefined>(undefined);
  const [sortByBalanceDue, setSortByBalanceDue] = useState<'desc' | 'asc' | undefined>(undefined);
  const navigate = useNavigate();
  const customerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const customersData = await getCustomers();
        setCustomers(customersData);
        
        // Fetch payments for all customers
        const paymentsData = await Promise.all(
          customersData.map(customer => getPayments(customer.id))
        );
        setPayments(paymentsData.flat());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  useEffect(() => {
    if (!isLoading && customers.length > 0) {
      const lastId = localStorage.getItem('dashboardLastViewedCustomerId');
      if (lastId && customerRefs.current[lastId]) {
        customerRefs.current[lastId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        localStorage.removeItem('dashboardLastViewedCustomerId');
      }
    }
  }, [isLoading, customers]);
  
  const calculatePendingPayments = () => {
    return customers.reduce((total, customer) => {
      const customerPayments = payments
        .filter(p => p.customer_id === customer.id)
        .reduce((sum, payment) => sum + payment.amount, 0);
      const pendingAmount = customer.work_amount - (customer.advance_amount + customerPayments);
      return total + (pendingAmount > 0 ? pendingAmount : 0);
    }, 0);
  };

  const calculateCompletedWorkPendingPayments = () => {
    return customers.reduce((total, customer) => {
      if (customer.work_completed) {
        const customerPayments = payments
          .filter(p => p.customer_id === customer.id)
          .reduce((sum, payment) => sum + payment.amount, 0);
        const pendingAmount = customer.work_amount - (customer.advance_amount + customerPayments);
        return total + (pendingAmount > 0 ? pendingAmount : 0);
      }
      return total;
    }, 0);
  };
  
  const totalWorkValue = customers.reduce((total, customer) => 
    total + customer.work_amount, 0
  );
  
  const totalPendingPayments = calculatePendingPayments();
  const completedWorkPendingPayments = calculateCompletedWorkPendingPayments();
  
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone_number.includes(searchTerm) ||
    customer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getCustomerPaymentInfo = (customer: Customer) => {
    const customerPayments = payments.filter(p => p.customer_id === customer.id);
    const totalPaid = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingAmount = customer.work_amount - customer.advance_amount - totalPaid;
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
    if (sortByBalanceDue === 'desc') {
      result = result.sort((a, b) => b.pendingAmount - a.pendingAmount);
    } else if (sortByBalanceDue === 'asc') {
      result = result.sort((a, b) => a.pendingAmount - b.pendingAmount);
    }
    return result;
  })();
  
  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    setCustomers(prev => 
      prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
    );
  };

  const handleCustomerDelete = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setPayments(prev => prev.filter(p => p.customer_id !== customerId));
  };

  const handlePaymentsClick = (customerId: string) => {
    localStorage.setItem('dashboardLastViewedCustomerId', customerId);
    navigate(`/payment-tracking?customerId=${customerId}`);
  };
  
  const getSortButtonLabel = () => {
    if (!sortByBalanceDue) return 'Sort by Balance Due: None';
    if (sortByBalanceDue === 'desc') return 'Sort by Balance Due: High → Low';
    return 'Sort by Balance Due: Low → High';
  };
  
  const handleSortToggle = () => {
    if (!sortByBalanceDue) setSortByBalanceDue('desc');
    else if (sortByBalanceDue === 'desc') setSortByBalanceDue('asc');
    else setSortByBalanceDue(undefined);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading customers...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background animate-fade-in">
      <Navbar />
      
      <main className="flex-1 container py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your business operations</p>
          </div>
          
          <Button 
            onClick={() => navigate('/add-customer')}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-lg p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </div>
          
          <div className="glass-card rounded-lg p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Work Value</p>
              <p className="text-2xl font-bold">₹{totalWorkValue.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="glass-card rounded-lg p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pending</p>
              <p className="text-2xl font-bold text-amber-500">₹{totalPendingPayments.toLocaleString()}</p>
            </div>
          </div>

          <div className="glass-card rounded-lg p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed Work Pending</p>
              <p className="text-2xl font-bold text-red-500">₹{completedWorkPendingPayments.toLocaleString()}</p>
            </div>
          </div>
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
          <Button variant={!filter ? 'default' : 'outline'} onClick={() => setFilter(undefined)}>All</Button>
          <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
          <Button variant={filter === 'completed' ? 'default' : 'outline'} onClick={() => setFilter('completed')}>Completed</Button>
          <Button
            variant={sortByBalanceDue ? 'default' : 'outline'}
            onClick={handleSortToggle}
          >
            {getSortButtonLabel()}
          </Button>
        </div>
        
        {filteredAndSortedCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedCustomers.map((customer) => (
              <div
                key={customer.id}
                ref={el => (customerRefs.current[customer.id] = el)}
              >
                <CustomerCard 
                  customer={customer} 
                  payments={payments.filter(p => p.customer_id === customer.id)}
                  onUpdate={handleCustomerUpdate}
                  onDelete={handleCustomerDelete}
                  onPaymentsClick={() => handlePaymentsClick(customer.id)}
                />
              </div>
            ))}
          </div>
        ) : (
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
      </main>
    </div>
  );
};

export default Dashboard;
