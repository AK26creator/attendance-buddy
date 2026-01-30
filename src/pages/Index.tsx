import { useState, useEffect, useCallback } from 'react';
import {
  getEmployees,
  getAttendance,
  deleteEmployee,
  Employee,
  AttendanceRecord
} from '@/lib/db';
import { AddEmployeeForm } from '@/components/AddEmployeeForm';
import { EmployeeList } from '@/components/EmployeeList';
import { MarkAttendance } from '@/components/MarkAttendance';
import { AttendanceTable } from '@/components/AttendanceTable';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ModeToggle } from '@/components/mode-toggle';
import { AnalyticsChart } from '@/components/AnalyticsChart';

const Index = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      const [employeeData, attendanceData] = await Promise.all([
        getEmployees(),
        getAttendance(),
      ]);
      setEmployees(employeeData);
      // Sort attendance by S.NO descending (newest first)
      setAttendance(attendanceData.sort((a, b) => b.sno - a.sno));
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle employee added
  const handleEmployeeAdded = (employee: Employee) => {
    setEmployees(prev => [...prev, employee]);
  };

  // Handle employee deleted
  const handleEmployeeDeleted = async (id: string) => {
    try {
      await deleteEmployee(id);
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast.success('Employee deleted');
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  // Handle attendance marked
  const handleAttendanceMarked = (record: AttendanceRecord) => {
    setAttendance(prev => [record, ...prev]);
  };

  // Handle attendance record deleted
  const handleRecordDeleted = (id: number) => {
    setAttendance(prev => prev.filter(r => r.id !== id));
  };

  // Calculate stats
  // Note: Late can be counted independently or as part of present.
  // User asked for 3 cards: Absent, Present, Late.
  // Assuming strict counters based on flags.
  const totalAbsent = attendance.filter(r => r.absent === 'Yes').length;
  const totalPresent = attendance.filter(r => r.present === 'Yes').length;
  const totalLate = attendance.filter(r => r.late === 'Yes').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Story Seeds Office Attendance
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage employees and track daily attendance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="hidden sm:flex"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <ModeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                Total Absent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {totalAbsent}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
                Total Present
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {totalPresent}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Total Late
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {totalLate}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Chart */}
        <div className="mb-6">
          <AnalyticsChart records={attendance} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Employee Management */}
          <div className="space-y-6">
            <AddEmployeeForm onEmployeeAdded={handleEmployeeAdded} />
            <MarkAttendance
              employees={employees}
              onAttendanceMarked={handleAttendanceMarked}
            />
          </div>

          {/* Right Column - Tables */}
          <div className="lg:col-span-2 space-y-6">
            <EmployeeList
              employees={employees}
              attendance={attendance}
              onDelete={handleEmployeeDeleted}
            />
            <AttendanceTable
              records={attendance}
              onRecordDeleted={handleRecordDeleted}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="container py-4">
          <p className="text-center text-sm text-muted-foreground">
            Story Seeds Office Attendance • Data stored locally in your browser
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
