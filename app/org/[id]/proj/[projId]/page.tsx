"use client";

import { db } from "@/firebase";
import { useAuth } from "@clerk/nextjs";
import { collection, doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";

import { Project, Stage } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
    updateProjectTitle,
    updateStages,
    getProjectStats,
    getProjectLeaderboard,
    migrateTasksToTaskPool,
    initializeUserScores,
} from "@/actions/actions";
import { useDispatch } from "react-redux";
import { updateStatus } from "@/lib/store/features/stageStatus/stageStatusSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import new components
import { ProjHeader } from "@/components/ProjHeader";
import { ProjStats } from "@/components/ProjStats";
import { ProjTeamAnalytics } from "@/components/ProjTeamAnalytics";
import { ProjNoStages } from "@/components/ProjNoStages";

export interface StageProgress {
    stageOrder: number;
    totalTasks: number;
    tasksCompleted: number;
    locked: boolean;
}

function ProjectPage({ params }: { params: { id: string; projId: string } }) {
    const { id, projId } = params;
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    
    // 基本状态
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isMockMode, setIsMockMode] = useState(false);
    
    // 项目相关状态
    const [teamSize, setTeamSize] = useState<string>("");
    const [responses, setResponses] = useState<string[]>([]);
    const [reorderedStages, setReorderedStages] = useState<Stage[]>([]);
    
    // 统计相关状态
    const [projectStats, setProjectStats] = useState<any>(null);
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [statsLoading, setStatsLoading] = useState(false);

    // Mock数据状态
    const [mockProject, setMockProject] = useState<Project | null>(null);
    const [mockStages, setMockStages] = useState<Stage[]>([]);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.replace("/");
        }
    }, [isLoaded, isSignedIn, router]);

    // Check if this is mock mode
    useEffect(() => {
        if (id === "mock-org-123") {
            setIsMockMode(true);
            // Create mock project data based on projId
            const mockProjects = [
                {
                    projId: "proj-1",
                    orgId: "mock-org-123",
                    title: "Frontend Development Project",
                    members: ["alice@test.com", "bob@test.com"],
                    teamCharterResponse: [
                        "Develop a modern, responsive web application using React and TypeScript",
                        "Alice (Frontend), Bob (Backend), Product Manager (External)",
                        "Create an intuitive user interface with optimal user experience",
                    ],
                },
                {
                    projId: "proj-2",
                    orgId: "mock-org-123",
                    title: "Backend Architecture Project",
                    members: ["charlie@test.com", "david@test.com"],
                    teamCharterResponse: [
                        "Design and implement scalable backend architecture",
                        "Charlie (Project Manager), David (QA Engineer)",
                        "Build robust, secure, and performant backend services",
                    ],
                },
            ];

            const project = mockProjects.find((p) => p.projId === projId);
            if (project) {
                setMockProject(project);

                // Create mock stages
                const stages: Stage[] = [
                    {
                        id: "stage-1",
                        title: "Requirements Analysis & Design",
                        order: 0,
                        tasksCompleted: 2,
                        totalTasks: 3,
                    },
                    {
                        id: "stage-2",
                        title: "Development Implementation",
                        order: 1,
                        tasksCompleted: 1,
                        totalTasks: 4,
                    },
                    {
                        id: "stage-3",
                        title: "Testing & Deployment",
                        order: 2,
                        tasksCompleted: 0,
                        totalTasks: 2,
                    },
                ];
                setMockStages(stages);
            }
        }
    }, [id, projId]);

    // 加载项目统计数据
    const loadProjectStats = async () => {
        if (isMockMode) {
            // Mock 数据
            setProjectStats({
                totalTasks: 9,
                completedTasks: 3,
                assignedTasks: 4,
                availableTasks: 2,
                overdueTasks: 0,
                completionRate: 33.33,
                stageCount: 3,
            });
            setLeaderboardData([
                {
                    id: "1",
                    user_email: "alice@test.com",
                    total_points: 15,
                    tasks_completed: 5,
                    tasks_assigned: 6,
                    streak: 3,
                },
                {
                    id: "2",
                    user_email: "bob@test.com",
                    total_points: 12,
                    tasks_completed: 4,
                    tasks_assigned: 5,
                    streak: 2,
                },
            ]);
            return;
        }

        setStatsLoading(true);
        try {
            // 加载项目统计
            const statsResult = await getProjectStats(projId);
            if (statsResult.success) {
                setProjectStats(statsResult.data);
            }

            // 加载排行榜数据
            const leaderboardResult = await getProjectLeaderboard(projId);
            if (leaderboardResult.success) {
                setLeaderboardData(leaderboardResult.leaderboard || []);
            }
        } catch (error) {
            console.error("Error loading project stats:", error);
        } finally {
            setStatsLoading(false);
        }
    };

    // 处理数据库迁移
    const handleMigration = async () => {
        if (isMockMode) {
            alert("Migration simulation completed (Mock mode)");
            return;
        }

        const confirmMigration = confirm(
            "This will migrate your tasks to the new task pool system. This action cannot be undone. Continue?",
        );

        if (!confirmMigration) return;

        try {
            const migrationResult = await migrateTasksToTaskPool();
            if (migrationResult.success) {
                await initializeUserScores(projId);
                alert("Migration completed successfully!");
                loadProjectStats(); // 重新加载统计数据
            } else {
                alert("Migration failed: " + migrationResult.message);
            }
        } catch (error) {
            console.error("Migration error:", error);
            alert("Migration failed. Please try again.");
        }
    };

    useEffect(() => {
        if (projId) {
            loadProjectStats();
        }
    }, [projId, isMockMode]);

    const [projData, projLoading, projError] = useDocument(
        isMockMode ? null : doc(db, "projects", projId),
    );
    const proj = isMockMode ? mockProject : (projData?.data() as Project);
    const [projTitle, setProjTitle] = useState(proj?.title || "");

    useEffect(() => {
        if (!isEditing) {
            setProjTitle(proj?.title || "");
        }
    }, [proj]);

    const [stagesData, stagesLoading, stagesError] = useCollection(
        isMockMode ? null : collection(db, "projects", projId, "stages"),
    );

    const stages: Stage[] = useMemo(() => {
        if (isMockMode) {
            return mockStages;
        }
        return (
            stagesData?.docs
                .map((doc) => ({
                    ...(doc.data() as Stage),
                }))
                .sort((a, b) => a.order - b.order) || []
        );
    }, [stagesData, isMockMode, mockStages]);

    useEffect(() => {
        if (!isEditing) {
            setReorderedStages(stages.map((stage) => ({ ...stage })));
        }
    }, [stages]);

    const [stageStatus, setStageStatus] = useState<number[]>([]);
    const dispatch = useDispatch();
    useEffect(() => {
        const newStageStatus = new Array(stages.length).fill(0);
        stages.forEach((stage, i) => {
            newStageStatus[i] =
                i > 0 && newStageStatus[i - 1] !== 2
                    ? 0
                    : stage.tasksCompleted == stage.totalTasks
                      ? 2
                      : 1;
        });
        dispatch(updateStatus(newStageStatus.map((status) => status === 0)));
        setStageStatus(newStageStatus);
    }, [stages]);

    if (isMockMode) {
        if (!mockProject) {
            return <Skeleton className="w-full h-96" />;
        }
    } else {
        if (stagesLoading || projLoading) {
            return <Skeleton className="w-full h-96" />;
        }
        if (stagesError) {
            return <div>Error: {stagesError.message}</div>;
        }
        if (projError) {
            return <div>Error: {projError.message}</div>;
        }
    }

    const handleEditSave = () => {
        try {
            if (isMockMode) {
                setMockStages([...reorderedStages]);
                if (mockProject && projTitle !== mockProject.title) {
                    setMockProject({
                        ...mockProject,
                        title: projTitle,
                    });
                }
                toast.success("Mock project roadmap updated successfully!");
                setIsEditing(false);
                return;
            }

            const stageUpdates: Stage[] = [];
            reorderedStages.forEach((stage, index) => {
                const originalStage = stages.find((s) => s.id === stage.id);
                if (!originalStage) {
                    stageUpdates.push({ ...stage, order: index });
                } else if (
                    stage.order !== index ||
                    (originalStage && stage.title !== originalStage.title)
                ) {
                    stageUpdates.push({
                        ...stage,
                        order: index,
                        title: stage.title,
                    });
                }
            });
            const stagesToDelete = stages.filter(
                (stage) =>
                    !reorderedStages.some(
                        (reorderedStage) => reorderedStage.id === stage.id,
                    ),
            );
            const stagesToDeleteIds = stagesToDelete.map((stage) => stage.id);
            updateStages(projId, stageUpdates, stagesToDeleteIds);

            if (proj && projTitle !== proj.title) {
                updateProjectTitle(projId, projTitle);
            }
            toast.success("Roadmap & Stages updated successfully!");
        } catch (error) {
            console.error("Error updating Roadmap & Stages:", error);
            toast.error("Failed to update Roadmap & Stages");
        }
    };

    const projectMembers = proj?.members || [];

    return (
        <div className="flex flex-col w-full h-full bg-gray-100">
            <ProjHeader
                id={id}
                projId={projId}
                projTitle={projTitle}
                isEditing={isEditing}
                stages={stages}
                setProjTitle={setProjTitle}
                setIsEditing={setIsEditing}
                handleEditSave={handleEditSave}
            />

            <div className="flex-1 p-6">
                <Tabs defaultValue="roadmap" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger
                            value="roadmap"
                            className="flex items-center gap-2"
                        >
                            <Target className="h-4 w-4" />
                            Project Roadmap
                        </TabsTrigger>
                        <TabsTrigger
                            value="team-analytics"
                            className="flex items-center gap-2"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Team Informations
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="roadmap" className="space-y-4">
                        {stages.length === 0 ? (
                            <ProjNoStages
                                id={id}
                                projTitle={projTitle}
                                teamSize={teamSize}
                                setTeamSize={setTeamSize}
                                setProjTitle={setProjTitle}
                                isMockMode={isMockMode}
                            />
                        ) : (
                            <>
                                {projectStats && <ProjStats projectStats={projectStats} />}
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="team-analytics">
                        <ProjTeamAnalytics
                            id={id}
                            projId={projId}
                            projectMembers={projectMembers}
                            isMockMode={isMockMode}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

export default ProjectPage;