import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Loader2 } from 'lucide-react';
import { addEmployee, Employee } from '@/lib/db';
import { toast } from 'sonner';

interface AddEmployeeFormProps {
  onEmployeeAdded: (employee: Employee) => void;
}

export function AddEmployeeForm({ onEmployeeAdded }: AddEmployeeFormProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [salary, setSalary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fields
    if (!employeeId.trim()) {
      toast.error('Employee ID is required');
      return;
    }
    if (!employeeName.trim()) {
      toast.error('Employee Name is required');
      return;
    }

    setIsLoading(true);
    try {
      const employee = await addEmployee({
        id: employeeId.trim(),
        name: employeeName.trim(),
        salary: Number(salary) || 0,
      });

      toast.success(`Employee "${employee.name}" added successfully`);
      onEmployeeAdded(employee);

      // Reset form
      setEmployeeId('');
      setEmployeeName('');
      setSalary('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5" />
          Add Employee
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                placeholder=""
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeName">Employee Name</Label>
              <Input
                id="employeeName"
                placeholder=""
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input
                id="salary"
                type="number"
                placeholder="0"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Employee
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
