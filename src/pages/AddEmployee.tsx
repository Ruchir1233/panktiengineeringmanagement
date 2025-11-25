import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { addEmployee } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

const AddEmployee = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone_number: '',
    daily_wage: '',
    overtime_rate: '1.5'
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.name || !formData.phone_number || !formData.daily_wage) {
        toast.error('Please fill all required fields');
        setIsSubmitting(false);
        return;
      }
      
      const dailyWage = parseFloat(formData.daily_wage);
      const overtimeRate = formData.overtime_rate ? parseFloat(formData.overtime_rate) : 1.5;
      
      if (isNaN(dailyWage) || dailyWage <= 0) {
        toast.error('Please enter a valid daily wage');
        setIsSubmitting(false);
        return;
      }
      
      if (isNaN(overtimeRate) || overtimeRate <= 0) {
        toast.error('Please enter a valid overtime rate');
        setIsSubmitting(false);
        return;
      }
      
      const employeeData = {
        name: formData.name,
        address: formData.address || null,
        phone_number: formData.phone_number,
        daily_wage: dailyWage,
        overtime_rate: overtimeRate
      };
      
      const result = await addEmployee(employeeData);
      
      if (result) {
        toast.success('Employee added successfully');
        navigate('/employee-attendance');
      } else {
        toast.error('Failed to add employee');
      }
    } catch (error: any) {
      console.error('Error adding employee:', error);
      const errorMessage = error?.message || 'An error occurred while adding the employee';
      
      // Check if it's a table not found error
      if (error?.code === '42P01' || errorMessage.includes('does not exist')) {
        toast.error('Employees table not found. Please ensure database migrations are applied.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background animate-fade-in">
      <Navbar />
      
      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Add New Employee</h1>
          <p className="text-muted-foreground mb-8">Create a new employee profile</p>
          
          <div className="glass-card rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Employee Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter employee name"
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
                  <Label htmlFor="daily_wage">
                    Daily Wage (₹) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="daily_wage"
                    name="daily_wage"
                    type="number"
                    step="0.01"
                    value={formData.daily_wage}
                    onChange={handleChange}
                    placeholder="Enter daily wage"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overtime_rate">
                    Overtime Rate <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="overtime_rate"
                    name="overtime_rate"
                    type="number"
                    step="0.01"
                    value={formData.overtime_rate}
                    onChange={handleChange}
                    placeholder="Enter overtime rate (default: 1.5)"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Default is 1.5x the daily wage</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/employee-attendance')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Employee'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddEmployee;

