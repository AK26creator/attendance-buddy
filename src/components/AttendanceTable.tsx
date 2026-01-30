import { AttendanceRecord, deleteAttendance } from '@/lib/db';
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
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Trash2, Download } from 'lucide-react';
import { exportToExcel } from '@/lib/excelExport';
import { toast } from 'sonner';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onRecordDeleted: (id: number) => void;
}

export function AttendanceTable({ records, onRecordDeleted }: AttendanceTableProps) {
  const handleDelete = async (id: number) => {
    try {
      await deleteAttendance(id);
      toast.success('Attendance record deleted');
      onRecordDeleted(id);
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const handleExport = () => {
    if (records.length === 0) {
      toast.error('No records to export');
      return;
    }

    exportToExcel(records);
    toast.success('Excel file downloaded successfully');
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
            Attendance Records ({records.length})
          </CardTitle>
          <Button onClick={handleExport} variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            No attendance records yet. Mark attendance above.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">S.NO</TableHead>
                  <TableHead className="w-[120px]">Employee ID</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead className="w-[100px] text-center">Absentees</TableHead>
                  <TableHead className="w-[100px] text-center">Late</TableHead>
                  <TableHead className="w-[100px] text-center">Present</TableHead>
                  <TableHead className="w-[150px]">Time</TableHead>
                  <TableHead className="w-[70px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.sno}</TableCell>
                    <TableCell>{record.employeeId}</TableCell>
                    <TableCell>{record.employeeName}</TableCell>
                    <TableCell className="text-center">
                      {record.absent === 'Yes' && (
                        <Badge variant="destructive" className="font-normal">
                          Yes
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {record.late === 'Yes' && (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600 font-normal">
                          Yes
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {record.present === 'Yes' && (
                        <Badge className="bg-success text-success-foreground font-normal hover:bg-success/90">
                          Yes
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.time || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => record.id && handleDelete(record.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
