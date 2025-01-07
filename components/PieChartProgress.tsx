import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ResponsivePieProgress = ({ progress = 75, title = "Progress" }) => {
    const percentage = Math.min(100, Math.max(0, progress));
    const remaining = 100 - percentage;

    const data = [
        { name: 'Progress', value: percentage },
        { name: 'Remaining', value: remaining }
    ];

    const colors = ['#000000', '#e5e7eb'];

    return (
        <Card className="w-full max-w-xs hover:shadow-lg transition-shadow">
            {/* <CardHeader className="p-3">
                <CardTitle className="text-lg font-bold text-center">{title}</CardTitle>
            </CardHeader> */}
            <CardContent className="p-2">
                <div className="relative w-full h-full min-w-[150px] max-w-[200px] mx-auto">
                    <PieChart width={200} height={200} className="w-full">
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colors[index]}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="text-4xl font-bold text-black-500">
                            {percentage}%
                        </div>
                        <div className="text-xs text-gray-500">
                            Complete
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ResponsivePieProgress;