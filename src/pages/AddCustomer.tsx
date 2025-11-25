import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { addCustomer, getCustomers } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from "@/components/ui/checkbox";

const AddCustomer = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone_number: '',
    location: '',
    work_amount: '',
    advance_amount: '',
    work_completed: false,
    referred_by: ''
  });

  useEffect(() => {
    const loadCustomers = async () => {
      const existing = await getCustomers();
      setCustomerSuggestions(existing.map(customer => customer.name));
    };
    loadCustomers();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, work_completed: checked }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.name || !formData.phone_number || !formData.location || !formData.work_amount) {
        toast.error('Please fill all required fields');
        setIsSubmitting(false);
        return;
      }
      
      const workAmount = parseFloat(formData.work_amount);
      const advanceAmount = formData.advance_amount ? parseFloat(formData.advance_amount) : 0;
      
      if (isNaN(workAmount) || workAmount <= 0) {
        toast.error('Please enter a valid work amount');
        setIsSubmitting(false);
        return;
      }
      
      if (isNaN(advanceAmount) || advanceAmount < 0) {
        toast.error('Please enter a valid advance amount');
        setIsSubmitting(false);
        return;
      }
      
      if (advanceAmount > workAmount) {
        toast.error('Advance amount cannot be greater than work amount');
        setIsSubmitting(false);
        return;
      }
      
      const customerData = {
        name: formData.name,
        address: formData.address || null,
        phone_number: formData.phone_number,
        location: formData.location,
        work_amount: workAmount,
        advance_amount: advanceAmount,
        work_completed: formData.work_completed,
        referred_by: formData.referred_by ? formData.referred_by : null
      };
      
      const result = await addCustomer(customerData);
      
      if (result) {
        toast.success('Customer added successfully');
        navigate('/dashboard');
      } else {
        toast.error('Failed to add customer');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('An error occurred while adding the customer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background animate-fade-in">
      <Navbar />
      
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Add New Customer</h1>
          <p className="text-muted-foreground mb-8">Create a new customer profile</p>
          
          <div className="glass-card rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone_number">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">
                    Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter location"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referred_by">
                    Reference
                  </Label>
                  <Input
                    id="referred_by"
                    name="referred_by"
                    list="customer-reference-options"
                    value={formData.referred_by}
                    onChange={handleChange}
                    placeholder="Select an existing customer or enter a custom reference"
                  />
                  <datalist id="customer-reference-options">
                    {customerSuggestions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground">
                    Optional: choose from existing customers or type any custom reference.
                  </p>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="work_amount">
                    Work Amount (₹) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="work_amount"
                    name="work_amount"
                    type="number"
                    value={formData.work_amount}
                    onChange={handleChange}
                    placeholder="Enter total work amount"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="advance_amount">Advance Amount (₹)</Label>
                  <Input
                    id="advance_amount"
                    name="advance_amount"
                    type="number"
                    value={formData.advance_amount}
                    onChange={handleChange}
                    placeholder="Enter advance amount (if any)"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2 flex items-center gap-2">
                  <Checkbox
                    id="work_completed"
                    checked={formData.work_completed}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor="work_completed" className="cursor-pointer">
                    Work Completed
                  </Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Customer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddCustomer;
