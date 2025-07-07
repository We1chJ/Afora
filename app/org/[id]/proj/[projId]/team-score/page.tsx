"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import OrganizationScoreCard from "@/components/OrganizationScoreCard";

function TeamScorePage({
    params: { id, projId },
}: {
    params: {
        id: string;
        projId: string;
    };
}) {
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const [projectTitle, setProjectTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [isMockMode, setIsMockMode] = useState(false);
    const [projectMembers, setProjectMembers] = useState<string[]>([]);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.replace("/");
        }
    }, [isLoaded, isSignedIn, router]);

    useEffect(() => {
        // Check if this is mock mode
        if (id === "mock-org-123") {
            setIsMockMode(true);
            loadMockData();
        } else {
            loadRealData();
        }
    }, [id, projId]);

    const loadMockData = () => {
        const mockProjectTitles = {
            "proj-1": "Frontend Development Project",
            "proj-2": "Backend Architecture Project",
        };

        const mockProjectMembers = {
            "proj-1": ["alice@test.com", "bob@test.com"],
            "proj-2": ["charlie@test.com", "david@test.com"],
        };

        setProjectTitle(
            mockProjectTitles[projId as keyof typeof mockProjectTitles] ||
                "Mock Project",
        );
        setProjectMembers(
            mockProjectMembers[projId as keyof typeof mockProjectMembers] || [],
        );
        setLoading(false);
    };

    const loadRealData = async () => {
        try {
            // TODO: Implement real data fetching from backend
            // Example API calls:
            // const projectResponse = await fetch(`/api/projects/${projId}`);
            // const project = await projectResponse.json();
            // setProjectTitle(project.title);
            // setProjectMembers(project.members);

            // For now, show empty state
            setProjectTitle("Project Team Score");
            setProjectMembers([]);
            setLoading(false);
        } catch (error) {
            console.error("Error loading project data:", error);
            setLoading(false);
        }
    };

    if (!isSignedIn) return null;

    if (loading) {
        return <Skeleton className="w-full h-96" />;
    }

    return (
        <div className="container mx-auto p-6">
            {/* Navigation */}
            <div className="mb-6">
                <Link href={`/org/${id}/proj/${projId}`}>
                    <Button variant="ghost" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Project
                    </Button>
                </Link>
            </div>

            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {projectTitle} - Team Score
                </h1>
                <p className="text-gray-600">
                    Track and analyze your project team's performance metrics
                    and collaboration scores.
                </p>
            </div>

            {/* Team Score Component */}
            <OrganizationScoreCard
                orgId={id}
                members={projectMembers}
                mockData={isMockMode}
                projectFilter={projId}
            />
        </div>
    );
}

export default TeamScorePage;
