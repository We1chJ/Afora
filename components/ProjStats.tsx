import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface ProjStatsProps {
    projectStats: {
        totalTasks: number;
        completedTasks: number;
        assignedTasks: number;
        availableTasks: number;
        overdueTasks: number;
        completionRate: number;
    };
}

export function ProjStats({ projectStats }: ProjStatsProps) {
    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Project Statistics
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {projectStats.totalTasks}
                        </div>
                        <div className="text-sm text-gray-500">
                            Total Tasks
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {projectStats.completedTasks}
                        </div>
                        <div className="text-sm text-gray-500">
                            Completed
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                            {projectStats.assignedTasks}
                        </div>
                        <div className="text-sm text-gray-500">
                            Assigned
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">
                            {projectStats.availableTasks}
                        </div>
                        <div className="text-sm text-gray-500">
                            Available
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {projectStats.overdueTasks}
                        </div>
                        <div className="text-sm text-gray-500">
                            Overdue
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {projectStats.completionRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">
                            Progress
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 