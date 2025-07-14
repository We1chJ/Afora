"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Leaderboard from "@/components/Leaderboard";
import { UserScore } from "@/types/types";
import { getProjectLeaderboard, getUserScore } from "@/actions/actions";

function LeaderboardPage() {
    const params = useParams();
    const id = params.id as string;
    const projId = params.projId as string;
    
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const [userScores, setUserScores] = useState<UserScore[]>([]);
    const [projectTitle, setProjectTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [isMockMode, setIsMockMode] = useState(false);

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
        // Mock leaderboard data
        const mockScores: UserScore[] = [
            {
                userId: "alice",
                email: "alice@test.com",
                totalPoints: 15,
                tasksCompleted: 15,
                tasksAssigned: 18,
                averageCompletionTime: 4.2,
                streak: 5,
            },
            {
                userId: "bob",
                email: "bob@test.com",
                totalPoints: 12,
                tasksCompleted: 12,
                tasksAssigned: 15,
                averageCompletionTime: 6.1,
                streak: 3,
            },
            {
                userId: "charlie",
                email: "charlie@test.com",
                totalPoints: 8,
                tasksCompleted: 8,
                tasksAssigned: 10,
                averageCompletionTime: 5.8,
                streak: 0,
            },
            {
                userId: "david",
                email: "david@test.com",
                totalPoints: 6,
                tasksCompleted: 6,
                tasksAssigned: 8,
                averageCompletionTime: 7.3,
                streak: 2,
            },
            // Add current user to mock data if we have user info
            ...(user?.primaryEmailAddress
                ? [
                      {
                          userId: user.id || "current-user",
                          email: user.primaryEmailAddress.emailAddress,
                          totalPoints: 10,
                          tasksCompleted: 10,
                          tasksAssigned: 12,
                          averageCompletionTime: 5.0,
                          streak: 1,
                      },
                  ]
                : []),
        ];

        const mockProjectTitles = {
            "proj-1": "Frontend Development Project",
            "proj-2": "Backend Architecture Project",
        };

        setUserScores(mockScores);
        setProjectTitle(
            mockProjectTitles[projId as keyof typeof mockProjectTitles] ||
                "Mock Project",
        );
        setLoading(false);
    };

    const loadRealData = async () => {
        try {
            // 获取项目排行榜数据
            const leaderboardResponse = await getProjectLeaderboard(projId);
            if (
                leaderboardResponse.success &&
                leaderboardResponse.leaderboard
            ) {
                // 将后端数据转换为前端需要的格式
                const formattedScores: UserScore[] =
                    leaderboardResponse.leaderboard.map((score: any) => ({
                        userId: score.id,
                        email: score.user_email,
                        totalPoints: score.total_points,
                        tasksCompleted: score.tasks_completed,
                        tasksAssigned: score.tasks_assigned,
                        averageCompletionTime:
                            score.average_completion_time || 0,
                        streak: score.streak || 0,
                    }));
                setUserScores(formattedScores);
            } else {
                console.error(
                    "Failed to load leaderboard:",
                    leaderboardResponse.message,
                );
                setUserScores([]);
            }

            // TODO: 获取项目标题（需要项目详情API）
            setProjectTitle("Project Leaderboard");
            setLoading(false);
        } catch (error) {
            console.error("Error loading leaderboard data:", error);
            setUserScores([]);
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

            {/* Leaderboard Component */}
            <Leaderboard
                projectId={projId}
                projectTitle={projectTitle}
                userScores={userScores}
                currentUserEmail={user?.primaryEmailAddress?.emailAddress}
                isMockMode={isMockMode}
            />
        </div>
    );
}

export default LeaderboardPage;
