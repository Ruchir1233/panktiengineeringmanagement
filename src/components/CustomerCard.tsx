import { Customer, Payment } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, Phone, Mail, CreditCard, Pencil, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateCustomer, deleteCustomer } from '@/lib/supabase';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface CustomerCardProps {
  customer: Customer;
  payments: Payment[];
  onUpdate: (updatedCustomer: Customer) => void;
  onDelete: (customerId: string) => void;
  onPaymentsClick?: () => void;
}

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-4 w-4"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const CustomerCard = ({ customer, payments, onUpdate, onDelete, onPaymentsClick }: CustomerCardProps) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(customer);
  
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = customer.work_amount - customer.advance_amount - totalPaid;

  const handleUpdate = async () => {
    const result = await updateCustomer(customer.id, editForm);
    if (result) {
      onUpdate(result);
      setIsEditing(false);
      toast.success('Customer updated successfully');
    } else {
      toast.error('Failed to update customer');
    }
  };

  const handleDelete = async () => {
    const success = await deleteCustomer(customer.id);
    if (success) {
      onDelete(customer.id);
      toast.success('Customer deleted successfully');
    } else {
      toast.error('Failed to delete customer');
    }
  };

  const handleWhatsApp = () => {
    const phoneNumber = customer.phone_number.replace(/\D/g, ''); // Remove non-digits
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = `tel:${customer.phone_number}`;
  };

  return (
    <Card className="glass-card overflow-hidden animate-fade-in transition-all hover:shadow-lg">
      <CardHeader className="p-4 border-b bg-secondary/50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Customer</p>
            <h3 className="text-lg font-bold">{customer.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="overflow-y-auto max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Edit Customer</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editForm.phone_number}
                      onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="work_amount">Work Amount</Label>
                    <Input
                      id="work_amount"
                      type="number"
                      value={editForm.work_amount}
                      onChange={(e) => setEditForm({ ...editForm, work_amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="advance_amount">Advance Amount</Label>
                    <Input
                      id="advance_amount"
                      type="number"
                      value={editForm.advance_amount}
                      onChange={(e) => setEditForm({ ...editForm, advance_amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="work_completed"
                      checked={Boolean(editForm.work_completed)}
                      onCheckedChange={(checked: boolean) => setEditForm({ ...editForm, work_completed: checked })}
                    />
                    <Label htmlFor="work_completed" className="cursor-pointer">
                      Work Completed
                    </Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate}>
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this customer? This action cannot be undone.
                    All associated payments will also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              size="sm" 
              className="bg-primary/10 text-primary hover:bg-primary/20"
              onClick={onPaymentsClick ? onPaymentsClick : () => navigate(`/payment-tracking?customerId=${customer.id}`)}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Payments
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 grid gap-3 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{customer.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <span 
              className="cursor-pointer hover:text-primary transition-colors"
              onClick={handleCall}
            >
              {customer.phone_number}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
              onClick={handleWhatsApp}
            >
              <WhatsAppIcon />
            </Button>
          </div>
        </div>
        {customer.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t mt-1">
          <div>
            <p className="text-xs text-muted-foreground">Work Amount</p>
            <p className="font-medium">₹{customer.work_amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Advance</p>
            <p className="font-medium">₹{customer.advance_amount.toLocaleString()}</p>
          </div>
        </div>
        <div className="pt-2 border-t mt-1">
          <p className="text-xs text-muted-foreground">Balance Due</p>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-medium ${pendingAmount > 0 ? 'text-destructive' : 'text-green-500'}`}>₹</span>
            <p className={`font-bold ${pendingAmount > 0 ? 'text-destructive' : 'text-green-500'}`}>
              {pendingAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
