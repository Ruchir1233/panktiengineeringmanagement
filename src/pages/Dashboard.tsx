import { useEffect, useState } from 'react';
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
  const [payments, setPayments] = useState<{ [key: string]: Payment[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const customersData = await getCustomers();
        setCustomers(customersData);
        
        // Fetch payments for each customer
        const paymentsData: { [key: string]: Payment[] } = {};
        for (const customer of customersData) {
          const customerPayments = await getPayments(customer.id);
          paymentsData[customer.id] = customerPayments;
        }
        setPayments(paymentsData);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const pendingPayments = customers.reduce((total, customer) => {
    const customerPayments = payments[customer.id] || [];
    const totalPaid = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const pending = customer.work_amount - customer.advance_amount - totalPaid;
    return total + (pending > 0 ? pending : 0);
  }, 0);
  
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone_number.includes(searchTerm) ||
    customer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCustomerUpdate = (updatedCustomer: Customer) => {
    setCustomers(prev => 
      prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
    );
  };

  const handleCustomerDelete = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    delete payments[customerId];
    setPayments({ ...payments });
  };
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <p className="text-2xl font-bold">
                ₹{customers.reduce((sum, c) => sum + c.work_amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="glass-card rounded-lg p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
              <p className="text-2xl font-bold">₹{pendingPayments.toLocaleString()}</p>
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
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading customers...</div>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <CustomerCard 
                key={customer.id} 
                customer={customer} 
                payments={payments[customer.id] || []}
                onUpdate={handleCustomerUpdate}
                onDelete={handleCustomerDelete}
              />
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
