import { useState } from 'react';
import { Employee, markAttendance, AttendanceRecord } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardCheck, UserCheck, UserX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MarkAttendanceProps {
  employees: Employee[];
  onAttendanceMarked: (record: AttendanceRecord) => void;
}

export function MarkAttendance({ employees, onAttendanceMarked }: MarkAttendanceProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAttendance = async (isPresent: boolean) => {
    if (!selectedEmployee) {
      toast.error('Please select an employee first');
      return;
    }

    setIsLoading(true);
    try {
      const record = await markAttendance(selectedEmployee, isPresent);
      const employee = employees.find(e => e.id === selectedEmployee);
      
      toast.success(
        `Marked ${employee?.name || selectedEmployee} as ${isPresent ? 'Present' : 'Absent'}`
      );
      
      onAttendanceMarked(record);
      setSelectedEmployee('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark attendance');
    } finally {
      setIsLoading(false);
    }
  };

  if (employees.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardCheck className="h-5 w-5" />
            Mark Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            Add employees first to mark attendance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5" />
          Mark Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger>
            <SelectValue placeholder="Select Employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.id} - {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-3">
          <Button
            onClick={() => handleMarkAttendance(true)}
            disabled={!selectedEmployee || isLoading}
            className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="mr-2 h-4 w-4" />
            )}
            Present
          </Button>
          <Button
            onClick={() => handleMarkAttendance(false)}
            disabled={!selectedEmployee || isLoading}
            variant="destructive"
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserX className="mr-2 h-4 w-4" />
            )}
            Absent
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
