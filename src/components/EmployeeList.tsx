import { Employee, AttendanceRecord } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, Trash2 } from 'lucide-react';
import { calculateSalary } from '@/lib/salary';

interface EmployeeListProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  onDelete: (id: string) => void;
}

export function EmployeeList({ employees, attendance, onDelete }: EmployeeListProps) {
  if (employees.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No employees added yet. Add your first employee above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Employees ({employees.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Base Salary</TableHead>
                <TableHead className="w-[100px]">Daily Rate</TableHead>
                <TableHead className="w-[80px] text-center">Leaves</TableHead>
                <TableHead className="w-[80px] text-center">LOP Days</TableHead>
                <TableHead className="w-[120px] font-bold">Payable</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                // Filter attendance for this employee
                const employeeAttendance = attendance.filter(
                  (r) => r.employeeId === employee.id
                );

                const salaryDetails = calculateSalary(
                  employee.salary,
                  employeeAttendance
                );

                return (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.id}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>₹{employee.salary.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      ₹{Math.round(salaryDetails.dailySalary).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={salaryDetails.totalLeaves > 0 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                        {salaryDetails.totalLeaves}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={salaryDetails.lopDays > 0 ? "text-red-600 font-bold" : "text-muted-foreground"}>
                        {salaryDetails.lopDays}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-green-700">
                      ₹{Math.round(salaryDetails.payableSalary).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(employee.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
