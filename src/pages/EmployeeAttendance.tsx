import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEmployees, getAttendance } from '@/lib/supabase';
import { Employee, Attendance } from '@/types';
import AttendanceModal from '@/components/AttendanceModal';
import { Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

type AttendanceBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const EmployeeAttendance = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [currentMonth, currentYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesData, attendanceData] = await Promise.all([
        getEmployees(),
        getAttendance(undefined, currentMonth, currentYear)
      ]);
      setEmployees(employeesData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  useEffect(() => {
    setSelectedEmployees(prev => {
      const employeeIds = new Set(employees.map(emp => emp.id));
      const filtered = new Set<string>();
      prev.forEach(id => {
        if (employeeIds.has(id)) {
          filtered.add(id);
        }
      });
      return filtered;
    });
  }, [employees]);

  const handleMonthChange = (month: number) => {
    setCurrentMonth(month);
    setSelectedDate(undefined);
  };

  const handleYearChange = (year: number) => {
    setCurrentYear(year);
    setSelectedDate(undefined);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDate(undefined);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDate(undefined);
  };

  // Create a map of date -> attendance records for quick lookup
  const attendanceByDate = useMemo(() => {
    const map: Record<string, Attendance[]> = {};
    attendance.forEach(record => {
      const date = record.date;
      if (!map[date]) {
        map[date] = [];
      }
      map[date].push(record);
    });
    return map;
  }, [attendance]);

  // Get attendance status for a date
  const selectedCount = selectedEmployees.size;
  const isFilterActive = selectedCount > 0;
  const isSingleSelection = selectedCount === 1;
  const showStatusColors = isSingleSelection;
  const singleSelectedId = isSingleSelection ? Array.from(selectedEmployees)[0] : null;

  const getDateStatus = (date: Date): { type: 'present' | 'partial' | 'absent' | 'ot' | 'none'; count: number } => {
    if (!isSingleSelection || !singleSelectedId) {
      return { type: 'none', count: 0 };
    }

    const dateString = date.toISOString().split('T')[0];
    const record = (attendanceByDate[dateString] || []).find(r => r.employee_id === singleSelectedId);

    if (!record) {
      return { type: 'none', count: 0 };
    }

    if (record.attendance_type === 'absent') {
      return { type: 'absent', count: 1 };
    }

    if (record.attendance_type === 'ot_day') {
      return { type: 'ot', count: 1 };
    }

    if (record.attendance_type === 'half_day' || record.attendance_type === 'hourly') {
      return { type: 'partial', count: 1 };
    }

    return { type: 'present', count: 1 };
  };

  const daysInMonth = useMemo(
    () => new Date(currentYear, currentMonth + 1, 0).getDate(),
    [currentMonth, currentYear]
  );

  const employeeAbsenceStats = useMemo(() => {
    const stats: Record<string, number> = {};
    attendance.forEach(record => {
      if (record.attendance_type === 'absent') {
        stats[record.employee_id] = (stats[record.employee_id] || 0) + 1;
      }
    });
    return stats;
  }, [attendance]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch) return employees;
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase())
    );
  }, [employeeSearch, employees]);

  const selectedDateDetails = useMemo(() => {
    if (!selectedDate || !isFilterActive) return [];
    const dateString = selectedDate.toISOString().split('T')[0];
    const records = attendanceByDate[dateString] || [];
    const lookup = new Map(records.map(record => [record.employee_id, record]));
    const sourceEmployees = employees.filter(emp => selectedEmployees.has(emp.id));

    return sourceEmployees.map(employee => ({
      employee,
      record: lookup.get(employee.id)
    }));
  }, [selectedDate, attendanceByDate, employees, selectedEmployees, isFilterActive]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background animate-fade-in">
      <Navbar />
      
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">Employee Attendance</h1>
              <p className="text-muted-foreground">Track and manage employee attendance</p>
            </div>
          </div>

          {employees.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <p className="text-muted-foreground mb-4">No employees found</p>
              <Button onClick={() => navigate('/add-employee')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Employee
              </Button>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden flex flex-col md:flex-row">
              {/* Employee filter panel */}
              <div className="w-full md:w-72 border-b md:border-b-0 md:border-r bg-muted/30 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Employees</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedCount} selected of {employees.length}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    placeholder="Search employees"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id="select-all"
                    checked={selectedEmployees.size === employees.length && employees.length > 0}
                    onCheckedChange={() => {
                      setSelectedEmployees(prev => {
                        if (prev.size === employees.length) {
                          return new Set();
                        }
                        return new Set(employees.map(emp => emp.id));
                      });
                    }}
                  />
                  <Label htmlFor="select-all" className="cursor-pointer">Select All</Label>
                </div>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {filteredEmployees.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No employees found</p>
                  ) : (
                    filteredEmployees.map(employee => {
                      const checked = selectedEmployees.has(employee.id);
                      return (
                        <div
                          key={employee.id}
                          className={cn(
                            "flex items-center justify-between rounded-lg border p-3 text-sm transition-colors",
                            checked ? "bg-primary/5 border-primary/30" : "bg-background"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`employee-${employee.id}`}
                              checked={checked}
                              onCheckedChange={() => {
                                setSelectedEmployees(prev => {
                                  const next = new Set(prev);
                                  if (next.has(employee.id)) {
                                    next.delete(employee.id);
                                  } else {
                                    next.add(employee.id);
                                  }
                                  return next;
                                });
                              }}
                            />
                            <div>
                              <label
                                htmlFor={`employee-${employee.id}`}
                                className="cursor-pointer font-medium leading-none"
                              >
                                {employee.name}{' '}
                                <span className="text-xs text-muted-foreground">
                                  ({Math.max(daysInMonth - (employeeAbsenceStats[employee.id] || 0), 0)}/{daysInMonth})
                                </span>
                              </label>
                              <p className="text-xs text-muted-foreground">{employee.phone_number}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex-1 p-6">
                {/* Month/Year Selector */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                      <Select
                        value={currentMonth.toString()}
                        onValueChange={(value) => handleMonthChange(parseInt(value))}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {monthNames.map((month, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={currentYear.toString()}
                        onValueChange={(value) => handleYearChange(parseInt(value))}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextMonth}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {showStatusColors ? (
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-900/30" />
                          <span className="text-muted-foreground">Present</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded bg-yellow-100 dark:bg-yellow-900/30" />
                          <span className="text-muted-foreground">Partial / Hours</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded bg-blue-100 dark:bg-blue-900/30" />
                          <span className="text-muted-foreground">OT Day</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded bg-destructive/20 border border-destructive/40" />
                          <span className="text-muted-foreground">Absent</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Select exactly one employee to highlight attendance colors.
                      </p>
                    )}
                  </div>

                  {/* Calendar */}
                  <div className="flex justify-center w-full">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      month={new Date(currentYear, currentMonth, 1)}
                      onMonthChange={(date) => {
                        setCurrentMonth(date.getMonth());
                        setCurrentYear(date.getFullYear());
                      }}
                      onDayClick={handleDateClick}
                      className="rounded-2xl border shadow-sm p-6 w-full max-w-4xl bg-background"
                      modifiers={{
                        isPresent: (date) => {
                          const status = getDateStatus(date);
                          return status.type === 'present' && date.getMonth() === currentMonth;
                        },
                        isPartial: (date) => {
                          const status = getDateStatus(date);
                          return status.type === 'partial' && date.getMonth() === currentMonth;
                        },
                        isAbsent: (date) => {
                          const status = getDateStatus(date);
                          return status.type === 'absent' && date.getMonth() === currentMonth;
                        },
                        isOt: (date) => {
                          const status = getDateStatus(date);
                          return status.type === 'ot' && date.getMonth() === currentMonth;
                        }
                      }}
                      modifiersClassNames={
                        showStatusColors
                          ? {
                              isPresent: "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50",
                              isPartial: "bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50",
                              isAbsent: "bg-destructive/20 hover:bg-destructive/30",
                              isOt: "bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                            }
                          : {}
                      }
                      classNames={{
                        months: "flex justify-center",
                        month: "space-y-6 w-full",
                        caption: "flex justify-between items-center text-xl font-semibold",
                        table: "w-full border-collapse text-base",
                        head_row: "grid grid-cols-7 text-sm font-semibold text-muted-foreground",
                        head_cell: "text-center py-2",
                        row: "grid grid-cols-7 gap-2",
                        cell: "relative",
                        day: "h-12 w-12 rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                        day_today: "border border-primary/40 text-primary font-semibold",
                        day_selected: "bg-primary text-primary-foreground",
                        day_outside: "text-muted-foreground/50",
                      }}
                    />
                  </div>

                  {selectedDate && (
                    <div className="mt-6 space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Attendance on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isFilterActive
                              ? 'Showing selected employees'
                              : 'Select employees from the left panel to view attendance'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                            Mark / Update Attendance
                          </Button>
                        </div>
                      </div>

                      <div className="border rounded-lg divide-y">
                        {selectedDateDetails.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground">
                            {isFilterActive
                              ? 'No attendance recorded for the selected employees on this date.'
                              : 'Select employees from the left panel to view their attendance.'}
                          </div>
                        ) : (
                          selectedDateDetails.map(({ employee, record }) => {
                            const statusLabel = record
                              ? record.attendance_type === 'full_day'
                                ? 'Full Day'
                                : record.attendance_type === 'half_day'
                                  ? 'Half Day'
                                  : record.attendance_type === 'hourly'
                                    ? `${record.hours || 0} hrs`
                                    : record.attendance_type === 'ot_day'
                                      ? 'OT Day'
                                      : 'Absent'
                              : 'No record';

                            let badgeVariant: AttendanceBadgeVariant = 'outline';
                            if (record) {
                              if (record.attendance_type === 'absent') {
                                badgeVariant = showStatusColors ? 'destructive' : 'outline';
                              } else if (
                                record.attendance_type === 'hourly' ||
                                record.attendance_type === 'half_day'
                              ) {
                                badgeVariant = showStatusColors ? 'secondary' : 'outline';
                              } else if (record.attendance_type === 'ot_day') {
                                badgeVariant = showStatusColors ? 'secondary' : 'outline';
                              } else {
                                badgeVariant = showStatusColors ? 'default' : 'outline';
                              }
                            }

                            return (
                              <div key={employee.id} className="flex items-center justify-between p-3">
                                <div>
                                  <p className="font-medium">{employee.name}</p>
                                  <p className="text-xs text-muted-foreground">{employee.phone_number}</p>
                                </div>
                                <Badge variant={badgeVariant}>
                                  {statusLabel}
                                </Badge>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedDate && (
        <AttendanceModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          date={selectedDate}
          employees={employees}
          onAttendanceUpdate={loadData}
        />
      )}
    </div>
  );
};

export default EmployeeAttendance;

