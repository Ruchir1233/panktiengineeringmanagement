import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getEmployees, getEmployeeAdvances, addEmployeeAdvance } from '@/lib/supabase';
import { Employee, EmployeeAdvance } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

const transactionOptions = ['Cash', 'Bank Transfer', 'UPI', 'Other'];

const EmployeeAdvances = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    transaction_type: transactionOptions[0],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeeList, advanceList] = await Promise.all([
        getEmployees(),
        getEmployeeAdvances()
      ]);
      setEmployees(employeeList);
      setAdvances(advanceList);
    } catch (error) {
      console.error('Error loading advance data:', error);
      toast.error('Failed to load advances');
    } finally {
      setLoading(false);
    }
  };

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach(emp => map.set(emp.id, emp));
    return map;
  }, [employees]);

  const totalsByEmployee = useMemo(() => {
    const totals: Record<string, number> = {};
    advances.forEach(advance => {
      totals[advance.employee_id] = (totals[advance.employee_id] || 0) + advance.amount;
    });
    return totals;
  }, [advances]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.employee_id || !formData.amount || !formData.date) {
      toast.error('Please fill all required fields');
      return;
    }

    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employee_id: formData.employee_id,
        amount: amountValue,
        transaction_type: formData.transaction_type,
        date: formData.date,
        notes: formData.notes || null
      };

      const result = await addEmployeeAdvance(payload);
      if (result) {
        toast.success('Advance recorded');
        setFormData(prev => ({
          ...prev,
          amount: '',
          notes: ''
        }));
        await loadData();
      } else {
        toast.error('Failed to record advance');
      }
    } catch (error) {
      console.error('Error recording advance:', error);
      toast.error('An error occurred while saving the advance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading advances...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background animate-fade-in">
      <Navbar />
      <main className="flex-1 container py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Employee Advances</h1>
          <p className="text-muted-foreground">
            Record advance payments and view totals for each employee.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {employees.map((employee) => {
            const total = totalsByEmployee[employee.id] || 0;
            if (total === 0) return null;
            return (
              <div key={employee.id} className="border rounded-xl p-4 glass-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">{employee.phone_number}</p>
                  </div>
                  <span className="text-lg font-bold">₹{total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Total advance given</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Record New Advance</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_type">Transaction Type</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setFormData({
                  employee_id: '',
                  date: format(new Date(), 'yyyy-MM-dd'),
                  amount: '',
                  transaction_type: transactionOptions[0],
                  notes: ''
                })}>
                  Reset
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Record Advance'}
                </Button>
              </div>
            </form>
          </div>

          <div className="glass-card rounded-xl p-6 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Advance History</h2>
            {advances.length === 0 ? (
              <p className="text-sm text-muted-foreground">No advances recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Employee</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {advances.map((advance) => {
                    const employee = employeeMap.get(advance.employee_id);
                    return (
                      <tr key={advance.id} className="border-t">
                        <td className="py-2">{format(new Date(advance.date), 'dd MMM yyyy')}</td>
                        <td className="py-2">{employee?.name || 'Unknown'}</td>
                        <td className="py-2 font-semibold">₹{advance.amount.toFixed(2)}</td>
                        <td className="py-2">{advance.transaction_type}</td>
                        <td className="py-2 text-muted-foreground">{advance.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeAdvances;

