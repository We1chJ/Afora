import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrganizationScoreCard from "./OrganizationScoreCard";

interface ProjTeamAnalyticsProps {
    id: string;
    projId: string;
    projectMembers: string[];
    isMockMode: boolean;
}

export function ProjTeamAnalytics({
    id,
    projId,
    projectMembers,
    isMockMode,
}: ProjTeamAnalyticsProps) {
    return (
        <div className="space-y-6">
            {/* 团队统计卡片 */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Team Statistics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <OrganizationScoreCard
                            orgId={id}
                            members={projectMembers}
                            mockData={isMockMode}
                            projectFilter={projId}
                        />
                        <OrganizationScoreCard
                            orgId={id}
                            members={projectMembers}
                            mockData={isMockMode}
                            projectFilter={projId}
                        />
                        <OrganizationScoreCard
                            orgId={id}
                            members={projectMembers}
                            mockData={isMockMode}
                            projectFilter={projId}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 团队成员列表 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-purple-600" />
                        Team Members
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Member
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {projectMembers.map((member) => (
                                    <tr key={member}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {member}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            Frontend Developer
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            Active
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Button variant="ghost" size="sm">
                                                View Profile
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 