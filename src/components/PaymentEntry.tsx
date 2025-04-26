import { Payment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

interface PaymentEntryProps {
  payment: Payment;
  onUpdate: (updatedPayment: Payment) => void;
  onDelete: (paymentId: string) => void;
}

const PaymentEntry = ({ payment, onUpdate, onDelete }: PaymentEntryProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(payment);
  const formattedDate = format(new Date(payment.created_at), 'dd MMM yyyy');
  
  const getPaymentModeIcon = () => {
    switch (payment.payment_mode.toLowerCase()) {
      case 'cash':
        return <span className="font-medium">💵</span>;
      case 'upi':
        return <span className="font-medium">📱</span>;
      case 'bank transfer':
        return <span className="font-medium">🏦</span>;
      case 'check':
        return <span className="font-medium">🧾</span>;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleUpdate = () => {
    onUpdate(editForm);
    setIsEditing(false);
  };
  
  return (
    <Card className="glass-card overflow-hidden animate-fade-in transition-all">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            {getPaymentModeIcon()}
          </div>
          <div>
            <p className="font-medium">₹{payment.amount.toLocaleString()}</p>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <CalendarIcon className="h-3 w-3 mr-1" />
              {formattedDate}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm">
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium">
              {payment.payment_mode}
            </span>
            {payment.notes && (
              <p className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                {payment.notes}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Payment</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payment_mode">Payment Mode</Label>
                    <Select
                      value={editForm.payment_mode}
                      onValueChange={(value) => setEditForm({ ...editForm, payment_mode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">CASH</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">BANK TRANSFER</SelectItem>
                        <SelectItem value="cheque">CHEQUE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    />
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
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this payment? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(payment.id)} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentEntry;
