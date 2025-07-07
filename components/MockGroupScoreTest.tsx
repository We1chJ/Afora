"use client";
import React, { useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    createMockOrganization,
    getMockOrganizationMembersResponses,
    createMockTeamProjects,
} from "@/actions/mockActions";
import OrganizationScoreCard from "./OrganizationScoreCard";
import { Users, TestTube, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const MockGroupScoreTest = () => {
    const [mockOrgData, setMockOrgData] = useState<any>(null);
    const [isSetupComplete, setIsSetupComplete] = useState(false);

    const setupMockData = async () => {
        try {
            // Create mock organization
            const orgResult = await createMockOrganization();
            if (orgResult.success) {
                setMockOrgData(orgResult.orgData);

                // Create mock projects
                await createMockTeamProjects();

                setIsSetupComplete(true);
                toast.success(
                    "Mock data setup complete! You can now test Team Score functionality",
                );
            }
        } catch (error) {
            console.error("Setup mock data failed:", error);
            toast.error("Failed to setup mock data");
        }
    };

    const testMockResponses = async () => {
        if (mockOrgData) {
            try {
                const responses = await getMockOrganizationMembersResponses(
                    mockOrgData.id,
                );
                console.log("Mock response data:", responses);
                toast.success(
                    "Mock response data retrieved successfully, check console output",
                );
            } catch (error) {
                console.error("Failed to get mock responses:", error);
                toast.error("Failed to get mock responses");
            }
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TestTube className="h-5 w-5" />
                        Group Score Function Test (Mock Mode)
                    </CardTitle>
                    <CardDescription>
                        Use mock team data to test team compatibility analysis
                        through real GPT API, bypassing authentication issues
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!isSetupComplete ? (
                        <div className="text-center py-8">
                            <h3 className="text-lg font-semibold mb-4">
                                Setup Mock Test Environment
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Click the button below to create mock
                                organization and team member data
                            </p>
                            <Button onClick={setupMockData} size="lg">
                                Create Mock Test Data
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="font-medium">
                                    Mock Data Setup Complete
                                </span>
                            </div>

                            {mockOrgData && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">
                                                Mock Organization Info
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div>
                                                <span className="font-medium">
                                                    Organization Name:
                                                </span>{" "}
                                                {mockOrgData.title}
                                            </div>
                                            <div>
                                                <span className="font-medium">
                                                    ID:
                                                </span>{" "}
                                                {mockOrgData.id}
                                            </div>
                                            <div>
                                                <span className="font-medium">
                                                    Description:
                                                </span>{" "}
                                                {mockOrgData.description}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">
                                                Team Members
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {mockOrgData.admins.map(
                                                        (admin: string) => (
                                                            <Badge
                                                                key={admin}
                                                                variant="default"
                                                            >
                                                                {admin} (Admin)
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {mockOrgData.members.map(
                                                        (member: string) => (
                                                            <Badge
                                                                key={member}
                                                                variant="secondary"
                                                            >
                                                                {member}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={testMockResponses}
                                    variant="outline"
                                >
                                    Test Mock Survey Responses
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Team Score Test Area */}
            {isSetupComplete && mockOrgData && (
                <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Users className="h-6 w-6" />
                        Team Score Function Test
                    </h2>
                    <OrganizationScoreCard
                        orgId={mockOrgData.id}
                        members={mockOrgData.members}
                        mockData={true}
                    />
                </div>
            )}
        </div>
    );
};

export default MockGroupScoreTest;
