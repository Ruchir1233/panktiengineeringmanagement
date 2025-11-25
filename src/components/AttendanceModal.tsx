import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Employee, Attendance } from '@/types';
import { addAttendance, updateAttendance, deleteAttendance, getAttendanceByDate } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';

interface AttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  employees: Employee[];
  onAttendanceUpdate: () => void;
}

const AttendanceModal = ({ open, onOpenChange, date, employees, onAttendanceUpdate }: AttendanceModalProps) => {
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Attendance>>({});
  const [formData, setFormData] = useState<Record<string, { type?: 'full_day' | 'half_day' | 'hourly' | 'absent' | 'ot_day'; hours?: number }>>({});

  const dateString = date.toISOString().split('T')[0];
  const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    if (open) {
      loadAttendance();
    }
  }, [open, date]);

  const loadAttendance = async () => {
    try {
      const records = await getAttendanceByDate(dateString);
      const recordsMap: Record<string, Attendance> = {};
      records.forEach(record => {
        recordsMap[record.employee_id] = record;
      });
      setAttendanceRecords(recordsMap);
      
      const initial: Record<string, { type?: 'full_day' | 'half_day' | 'hourly' | 'absent' | 'ot_day'; hours?: number }> = {};
      employees.forEach(emp => {
        const existing = recordsMap[emp.id];
        initial[emp.id] = {
          type: existing?.attendance_type,
          hours: existing?.hours || undefined
        };
      });
      setFormData(initial);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleTypeChange = (employeeId: string, type: 'full_day' | 'half_day' | 'hourly' | 'absent' | 'ot_day') => {
    setFormData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        type,
        hours: type === 'hourly' ? prev[employeeId]?.hours || 8 : undefined
      }
    }));
  };

  const handleHoursChange = (employeeId: string, hours: string) => {
    const hoursNum = parseFloat(hours);
    setFormData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        hours: isNaN(hoursNum) ? undefined : hoursNum
      }
    }));
  };

  const handleDelete = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const existing = attendanceRecords[employeeId];
    if (!existing) return;

    if (!confirm(`Are you sure you want to delete attendance for ${employee.name}?`)) {
      return;
    }

    setLoading(true);
    try {
      const success = await deleteAttendance(existing.id);
      if (success) {
        toast.success(`Attendance deleted for ${employee.name}`);
        await loadAttendance();
        onAttendanceUpdate();
        // Reset form data for this employee
        setFormData(prev => ({
          ...prev,
          [employeeId]: { type: undefined, hours: undefined }
        }));
      } else {
        toast.error(`Failed to delete attendance for ${employee.name}`);
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
      toast.error('An error occurred while deleting attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    const operations: Promise<Attendance | null>[] = [];

    for (const employee of employees) {
      const data = formData[employee.id];
      if (!data?.type) {
        continue;
      }

      if (data.type === 'hourly' && (!data.hours || data.hours <= 0)) {
        toast.error(`Please enter valid hours for ${employee.name}`);
        return;
      }

      const attendanceData = {
        employee_id: employee.id,
        date: dateString,
        attendance_type: data.type,
        hours: data.type === 'hourly' ? data.hours : null
      };

      const existing = attendanceRecords[employee.id];
      if (existing) {
        operations.push(updateAttendance(existing.id, attendanceData));
      } else {
        operations.push(addAttendance(attendanceData));
      }
    }

    if (operations.length === 0) {
      toast.info('Select attendance for at least one employee.');
      return;
    }

    setLoading(true);
    try {
      await Promise.all(operations);
      toast.success('Attendance saved successfully');
      await loadAttendance();
      onAttendanceUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('An error occurred while saving attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attendance for {formattedDate}</DialogTitle>
          <DialogDescription>
            Mark attendance for all employees for this date
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {employees.map((employee) => {
            const existing = attendanceRecords[employee.id];
            const data = formData[employee.id] || {};

            return (
              <div key={employee.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {employee.phone_number}
                    </p>
                  </div>
                  {existing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <RadioGroup
                  value={data.type ?? ''}
                  onValueChange={(value) => handleTypeChange(employee.id, value as 'full_day' | 'half_day' | 'hourly' | 'absent' | 'ot_day')}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full_day" id={`${employee.id}-full_day`} />
                    <Label htmlFor={`${employee.id}-full_day`} className="cursor-pointer">
                      Full Day
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="half_day" id={`${employee.id}-half_day`} />
                    <Label htmlFor={`${employee.id}-half_day`} className="cursor-pointer">
                      Half Day
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ot_day" id={`${employee.id}-ot_day`} />
                    <Label htmlFor={`${employee.id}-ot_day`} className="cursor-pointer">
                      OT Day
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hourly" id={`${employee.id}-hourly`} />
                    <Label htmlFor={`${employee.id}-hourly`} className="cursor-pointer">
                      Hourly
                    </Label>
                    {data.type === 'hourly' && (
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={data.hours || ''}
                        onChange={(e) => handleHoursChange(employee.id, e.target.value)}
                        placeholder="Hours"
                        className="w-24 ml-2"
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="absent" id={`${employee.id}-absent`} />
                    <Label htmlFor={`${employee.id}-absent`} className="cursor-pointer">
                      Absent
                    </Label>
                  </div>
                </RadioGroup>

                {existing && (
                  <p className="text-xs text-muted-foreground text-center">
                    Last updated: {new Date(existing.created_at).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveAll} disabled={loading}>
            {loading ? 'Saving...' : 'Save Attendance'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceModal;

