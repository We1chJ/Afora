"use client";
import React from "react";
import OrganizationScoreCard from "./OrganizationScoreCard";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestTube, Users, Wifi } from "lucide-react";
import { testOpenAIConnection } from "@/ai_scripts/testConnection";
import { toast } from "sonner";

const SimpleGroupScoreTest = () => {
    // Fixed mock data
    const mockOrgData = {
        id: "test-org-123",
        title: "Test Organization",
        members: [
            "alice@test.com",
            "bob@test.com",
            "charlie@test.com",
            "david@test.com",
        ],
    };

    const handleTestConnection = async () => {
        toast.loading("Testing OpenAI API connection...");
        try {
            const result = await testOpenAIConnection();
            if (result.success) {
                toast.success(`Connection successful! ${result.response}`);
            } else {
                toast.error(`Connection failed: ${result.message}`);
            }
        } catch (error) {
            toast.error(`Connection test error: ${error}`);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TestTube className="h-5 w-5" />
                        Group Score Direct Test
                    </CardTitle>
                    <CardDescription>
                        Use mock team data to analyze team compatibility through
                        real GPT API
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-2">
                                Test Team Members:
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {mockOrgData.members.map((member) => (
                                    <Badge key={member} variant="secondary">
                                        {member}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            <p>
                                • Alice: Frontend Development Expert (React,
                                TypeScript, UI/UX Design)
                            </p>
                            <p>
                                • Bob: Backend Architect (Node.js, PostgreSQL,
                                Docker, AWS)
                            </p>
                            <p>
                                • Charlie: Project Manager (Project Management,
                                Scrum, Business Analysis)
                            </p>
                            <p>
                                • David: Test Engineer (Testing, Quality
                                Assurance, Automation)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Users className="h-6 w-6" />
                    Team Score Analysis Results
                </h2>
                <OrganizationScoreCard
                    orgId={mockOrgData.id}
                    members={mockOrgData.members}
                    mockData={true}
                />
            </div>
        </div>
    );
};

export default SimpleGroupScoreTest;
