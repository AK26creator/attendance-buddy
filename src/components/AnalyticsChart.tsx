import { AttendanceRecord } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { startOfDay, parse, compareAsc } from 'date-fns';

interface AnalyticsChartProps {
    records: AttendanceRecord[];
}

export function AnalyticsChart({ records }: AnalyticsChartProps) {
    // 1. Group data by date
    const groupedData = records.reduce((acc, record) => {
        const date = record.date;
        if (!acc[date]) {
            acc[date] = { date, present: 0, absent: 0, late: 0 };
        }

        if (record.present === 'Yes') acc[date].present += 1;
        if (record.absent === 'Yes') acc[date].absent += 1;
        if (record.late === 'Yes') acc[date].late += 1;

        return acc;
    }, {} as Record<string, { date: string; present: number; absent: number; late: number }>);

    // 2. Convert to array and sort by date
    const data = Object.values(groupedData).sort((a, b) => {
        const dateA = parse(a.date, 'dd-MM-yyyy', new Date());
        const dateB = parse(b.date, 'dd-MM-yyyy', new Date());
        return compareAsc(dateA, dateB);
    });

    if (data.length === 0) {
        return null;
    }

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="present"
                                stroke="#22c55e"
                                fillOpacity={1}
                                fill="url(#colorPresent)"
                                name="Present"
                            />
                            <Area
                                type="monotone"
                                dataKey="late"
                                stroke="#eab308"
                                fillOpacity={1}
                                fill="url(#colorLate)"
                                name="Late"
                            />
                            <Area
                                type="monotone"
                                dataKey="absent"
                                stroke="#ef4444"
                                fillOpacity={1}
                                fill="url(#colorAbsent)"
                                name="Absent"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
