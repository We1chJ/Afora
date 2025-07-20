"use client";
import { db } from "@/firebase";
import { Project } from "@/types/types";
import {
    collection,
    DocumentData,
    FirestoreError,
    getDocs,
    query,
    QuerySnapshot,
    where,
    doc,
    getDoc,
} from "firebase/firestore";
import React, { useEffect, useState, useTransition } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { Button } from "./ui/button";
import { updateProjects, createProject, deleteProject } from "@/actions/actions";
import { mockUpdateProjects } from "@/actions/mockActions";
import { toast } from "sonner";
import ProjectCard from "./ProjectCard";
import { Skeleton } from "./ui/skeleton";
import {
    Plus,
    FolderOpen,
    Users,
    Calendar,
    BarChart3,
    Target,
    ArrowRight,
    Folder,
    Briefcase,
    Trash2,
} from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "./ui/dialog";
import { Organization, projQuestions } from "@/types/types";

type MatchingOutput = {
    group_size: number;
    groups: string[][];
};

const ProjTab = ({
    orgId,
    projectsData,
    loading,
    error,
    userRole,
    userId,
    isMockMode = false,
}: {
    userId: string;
    userRole: string;
    orgId: string;
    projectsData: QuerySnapshot<DocumentData, DocumentData> | undefined;
    loading: boolean;
    error: FirestoreError | undefined;
    isMockMode?: boolean;
}) => {
    const [isPending, startTransition] = useTransition();
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState("");
    const [teamSize, setTeamSize] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [output, setOutput] = useState("");
    const [parsedOutput, setParsedOutput] = useState<MatchingOutput | null>(
        null,
    );

    // Only use Firebase queries when not in mock mode
    const adminQ = !isMockMode
        ? query(collection(db, "projects"), where("orgId", "==", orgId))
        : null;
    const [allProjects, apLoading, apError] = useCollection(adminQ);

    const userQ = !isMockMode
        ? query(
              collection(db, "users", userId, "projs"),
              where("orgId", "==", orgId),
          )
        : null;
    const [userProjects, userLoading, userError] = useCollection(userQ);
    const [userProjList, setUserProjList] = useState<Project[]>([]);

    // Mock project data for editor users
    const mockUserProjects: Project[] = [
        {
            projId: "proj-1",
            orgId: "mock-org-123",
            title: "Frontend Development Project",
            members: ["alice@test.com", "bob@test.com"],
            teamCharterResponse: [],
        },
        {
            projId: "proj-2",
            orgId: "mock-org-123",
            title: "Backend Architecture Project",
            members: ["charlie@test.com", "david@test.com"],
            teamCharterResponse: [],
        },
    ];

    useEffect(() => {
        if (isMockMode) {
            // In mock mode, simulate user projects based on user email
            const userEmail = userId || "admin@test.com";
            const filteredProjects = mockUserProjects.filter(
                (proj) =>
                    proj.members.includes(userEmail) || userRole === "admin",
            );
            setUserProjList(filteredProjects);
        } else {
            const fetchProjects = async () => {
                if (
                    !userLoading &&
                    !userError &&
                    userProjects &&
                    userProjects.docs.length > 0
                ) {
                    const projectIds = userProjects.docs
                        .map((doc) => doc.id)
                        .filter(Boolean);
                    if (projectIds.length > 0) {
                        const projectDocs = await getDocs(
                            query(
                                collection(db, "projects"),
                                where("__name__", "in", projectIds),
                            ),
                        );
                        const projects = projectDocs.docs.map(
                            (doc) => doc.data() as Project,
                        );
                        setUserProjList(projects);
                    }
                } else if (
                    !userLoading &&
                    !userError &&
                    (!userProjects || userProjects.docs.length === 0)
                ) {
                    // 如果没有用户项目，清空列表
                    setUserProjList([]);
                }
            };
            fetchProjects();
        }
    }, [
        userProjects,
        userLoading,
        userError,
        isMockMode,
        userId,
        userRole,
        refreshTrigger,
    ]);

    useEffect(() => {
        if (output) {
            try {
                const parsed: MatchingOutput = JSON.parse(output);
                setParsedOutput(parsed);
            } catch (error) {
                console.error("Failed to parse output:", error);
            }
        }
    }, [output]);

    const handleAccept = () => {
        if (parsedOutput) {
            startTransition(async () => {
                try {
                    if (isMockMode) {
                        const result = await mockUpdateProjects(
                            orgId,
                            parsedOutput.groups,
                        );
                        if (result.success) {
                            toast.success(
                                "Mock team groups updated successfully!",
                            );
                        } else {
                            toast.error(
                                "Failed to update groups: " + result.message,
                            );
                        }
                    } else {
                        await updateProjects(orgId, parsedOutput.groups);
                        toast.success("Groups updated successfully");
                    }
                } catch (error) {
                    console.error("Failed to update groups:", error);
                    toast.error("Failed to update groups");
                }
            });
            setOutput("");
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectTitle.trim()) {
            toast.error("Please enter a project title");
            return;
        }

        if (!teamSize.trim()) {
            toast.error("Please enter team size");
            return;
        }

        startTransition(async () => {
            try {
                console.log("🔍 ProjTab.tsx - 开始执行团队生成逻辑");
                const org = await getDoc(doc(db, "organizations", orgId));
                const orgData = org?.data() as Organization;
                console.log("🔍 ProjTab.tsx - orgData:", orgData);
                if (!orgData) {
                    toast.error("No organization found");
                    return;
                }

                const memberList = orgData.members;
                console.log("🔍 ProjTab.tsx - memberList:", memberList);
                
                const userDataPromise = memberList.map(async (user) => {
                    const userDoc = await getDoc(doc(db, "users", user));
                    const userDocData = userDoc.data();
                    const surveyResponse = userDocData?.onboardingSurveyResponse
                        ? userDocData.onboardingSurveyResponse.join(",")
                        : "";
                    return `{${user}:${surveyResponse}}`;
                });

                const userData = await Promise.all(userDataPromise);
                console.log("🔍 ProjTab.tsx - userData:", userData);

                console.log("🔍 ProjTab.tsx - 准备调用matching函数");
                
                let teamOutput: MatchingOutput = { group_size:0, groups: []};
                
                try {
                    console.log("🔍 ProjTab.tsx - 开始调用matching API...");
                    
                    const response = await fetch('/api/matching', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            teamSize,
                            questions: projQuestions,
                            input: userData,
                            totalMembers: memberList.length
                        })
                    });
                    
                    // 检查HTTP状态码
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("❌ ProjTab.tsx - API响应错误:", {
                            status: response.status,
                            statusText: response.statusText,
                            body: errorText
                        });
                        throw new Error(`API调用失败 (${response.status}): ${errorText || response.statusText}`);
                    }

                    // 检查Content-Type
                    const contentType = response.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                        throw new Error("API返回的不是JSON格式");
                    }
                    
                    // 解析JSON响应
                    const jsonResponse = await response.json();
                    console.log("🔍 ProjTab.tsx - API响应数据:", jsonResponse);

                    // 验证响应数据结构
                    if (!jsonResponse || typeof jsonResponse !== 'object') {
                        throw new Error("API返回的数据格式无效");
                    }

                    if (!Array.isArray(jsonResponse.groups)) {
                        throw new Error("API返回的groups不是数组");
                    }

                    teamOutput = jsonResponse;
                    console.log("🔍 ProjTab.tsx - matching API调用完成");
                } catch (error) {
                    console.error("❌ ProjTab.tsx - matching API调用失败:", error);
                    toast.error(`团队生成失败: ${(error as Error).message}`);
                    return;
                }
                
                console.log("🔍 ProjTab.tsx - teamOutput:", teamOutput);
                console.log("🔍 ProjTab.tsx - teamOutput type:", typeof teamOutput);
                console.log("🔍 ProjTab.tsx - teamOutput keys:", Object.keys(teamOutput));
                
                const parsedTeamOutput: MatchingOutput = teamOutput;
                
                if (isMockMode) {
                    const result = await mockUpdateProjects(orgId, parsedTeamOutput.groups);
                    if (!result.success) {
                        toast.error("Failed to update groups: " + result.message);
                        return;
                    }
                } else {
                    await updateProjects(orgId, parsedTeamOutput.groups);
                }

                if (isMockMode) {
                    toast.success(`Mock project "${newProjectTitle}" created successfully with team generation!`);
                } else {
                    const result = await createProject(orgId, newProjectTitle, []);
                    if (result.success) {
                        toast.success(result.message || `Project "${newProjectTitle}" created successfully with team generation!`);
                        setRefreshTrigger((prev) => prev + 1);
                    } else {
                        toast.error(result.message || "Failed to create project");
                        return;
                    }
                }

                setNewProjectTitle("");
                setTeamSize("");
                setIsNewProjectDialogOpen(false);
                
            } catch (error) {
                console.error("Failed to create project with team generation:", error);
                toast.error("Failed to create project: " + (error as Error).message);
            }
        });
    };

    // 删除项目
    const handleDeleteProject = async (projectId: string, projectTitle: string) => {
        const confirmDelete = confirm(
            `Are you sure you want to delete the project "${projectTitle}"?\n\nThis action will permanently delete:\n• The project and all its stages\n• All tasks and submissions\n• Team member assignments\n\nThis action cannot be undone!`
        );

        if (!confirmDelete) return;

        startTransition(async () => {
            try {
                if (isMockMode) {
                    toast.success(`Mock project "${projectTitle}" deleted successfully!`);
                    setRefreshTrigger((prev) => prev + 1);
                    return;
                }

                const result = await deleteProject(projectId);
                if (result.success) {
                    toast.success(`Project "${projectTitle}" deleted successfully!`);
                    setRefreshTrigger((prev) => prev + 1);
                } else {
                    toast.error(result.message || "Failed to delete project");
                }
            } catch (error) {
                console.error("Failed to delete project:", error);
                toast.error("Failed to delete project: " + (error as Error).message);
            }
        });
    };

    // Use mock data when in mock mode
    const displayProjects = isMockMode
        ? { docs: projectsData?.docs || [] }
        : userRole === "admin"
          ? allProjects
          : null;

    const displayLoading = isMockMode
        ? false
        : userRole === "admin"
          ? apLoading
          : userLoading;
    const displayError = isMockMode
        ? null
        : userRole === "admin"
          ? apError
          : userError;

    // Get all projects for display
    const allProjectsList =
        userRole === "admin"
            ? (displayProjects?.docs || []).map((doc) =>
                  isMockMode ? doc.data() : (doc.data() as Project),
              )
            : userProjList;

    const totalProjects = allProjectsList.length;
    const activeProjects = allProjectsList.filter(
        (proj) => proj.members && proj.members.length > 0,
    ).length;

    return (
        <div className="flex h-auto bg-gradient-to-br from-gray-50 to-purple-50 rounded-lg overflow-hidden py-12">
            {/* Left Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold">
                            Project Management
                        </h2>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
                            <div className="text-2xl font-bold">
                                {totalProjects}
                            </div>
                            <div className="text-xs opacity-90">
                                Total Projects
                            </div>
                        </div>
                        <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
                            <div className="text-2xl font-bold">
                                {activeProjects}
                            </div>
                            <div className="text-xs opacity-90">Active</div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                        <div className="text-sm font-medium text-gray-500">
                            Project Overview
                        </div>
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            Total Projects
                                        </span>
                                        <Badge variant="secondary">
                                            {totalProjects}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            Active Projects
                                        </span>
                                        <Badge variant="default">
                                            {activeProjects}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            Role
                                        </span>
                                        <Badge
                                            variant={
                                                userRole === "admin"
                                                    ? "destructive"
                                                    : "secondary"
                                            }
                                        >
                                            {userRole === "admin"
                                                ? "Admin"
                                                : "Member"}
                                        </Badge>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">
                                            Total Members
                                        </span>
                                        <Badge variant="outline">
                                            {allProjectsList.reduce(
                                                (total, proj) =>
                                                    total +
                                                    (proj.members?.length ||
                                                        0),
                                                0,
                                            )}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-2">
                        {userRole === "admin" && (
                            <>
                                <Dialog
                                    open={isNewProjectDialogOpen}
                                    onOpenChange={setIsNewProjectDialogOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            className={`w-full ${totalProjects === 0 ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg text-white" : ""}`}
                                            size={
                                                totalProjects === 0
                                                    ? "default"
                                                    : "sm"
                                            }
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            {totalProjects === 0
                                                ? "Create First Project"
                                                : "New Project"}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                Create New Project
                                            </DialogTitle>
                                            <DialogDescription>
                                                Enter a name for your new
                                                project.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="flex flex-col gap-2">
                                                <label
                                                    htmlFor="project-title"
                                                    className="text-sm font-medium"
                                                >
                                                    Project Title
                                                </label>
                                                <Input
                                                    id="project-title"
                                                    value={newProjectTitle}
                                                    onChange={(e) =>
                                                        setNewProjectTitle(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Enter project title..."
                                                    onKeyPress={(e) =>
                                                        e.key === "Enter" &&
                                                        handleCreateProject()
                                                    }
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label
                                                    htmlFor="team-size"
                                                    className="text-sm font-medium"
                                                >
                                                    Team Size
                                                </label>
                                                <Input
                                                    id="team-size"
                                                    value={teamSize}
                                                    onChange={(e) =>
                                                        setTeamSize(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Enter team size..."
                                                    onKeyPress={(e) =>
                                                        e.key === "Enter" &&
                                                        handleCreateProject()
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setIsNewProjectDialogOpen(
                                                        false,
                                                    )
                                                }
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleCreateProject}
                                                disabled={
                                                    isPending ||
                                                    !newProjectTitle.trim() ||
                                                    !teamSize.trim()
                                                }
                                            >
                                                {isPending
                                                    ? "Creating..."
                                                    : "Create Project"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                {/* Delete Project Button */}
                                {allProjectsList.length > 0 && (
                                    <div className="space-y-2 mt-4">
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Delete Projects
                                        </div>
                                        {allProjectsList.map((project) => (
                                            <Button
                                                key={`delete-btn-${project.projId}`}
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-red-600 hover:border-red-200 hover:bg-red-50"
                                                onClick={() => handleDeleteProject(project.projId, project.title)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete {project.title}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Team Generation Results */}
                {output && parsedOutput && parsedOutput.groups && (
                    <div className="p-6 border-b border-gray-200 bg-blue-50">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Generated Team Groups
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            {parsedOutput.groups.map((group, index) => (
                                <div
                                    key={`team-group-${index}`}
                                    className="bg-white p-4 rounded-lg shadow-sm border"
                                >
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Group {index + 1}
                                    </h4>
                                    <ul className="space-y-1">
                                        {group.map((member, memberIndex) => (
                                            <li
                                                key={`member-${index}-${memberIndex}-${member}`}
                                                className="text-sm text-gray-600 flex items-center gap-2"
                                            >
                                                <Users className="h-3 w-3" />
                                                {member}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-4">
                            <Button disabled={isPending} onClick={handleAccept}>
                                {isPending ? "Accepting..." : "Accept Groups"}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setOutput("")}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Content Header */}
                <div className="p-6 border-b border-gray-200 bg-white">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Project Overview
                    </h3>
                    <p className="text-sm text-gray-500">
                        Manage and monitor all your projects
                    </p>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {allProjectsList.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {allProjectsList
                                .sort((a, b) =>
                                    a.title.localeCompare(b.title),
                                )
                                .map((proj) => (
                                    <div
                                        key={`project-${proj.projId}`}
                                        className="group"
                                    >
                                        <ProjectCard
                                            key={`card-${proj.projId}`}
                                            orgId={orgId}
                                            projId={proj.projId}
                                            projectName={proj.title}
                                            backgroundImage={""}
                                            tasks={[]}
                                        />
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 max-w-md mx-auto">
                                <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {userRole === "admin"
                                        ? "欢迎来到项目管理！"
                                        : "No projects assigned"}
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    {userRole === "admin"
                                        ? "开始创建您的第一个项目，体验全新的任务池管理系统"
                                        : "Wait for admins to create projects and assign you"}
                                </p>
                                {userRole === "admin" && (
                                    <div className="bg-white p-4 rounded-lg border border-purple-200 text-sm text-gray-600">
                                        <h4 className="font-medium text-purple-800 mb-2">
                                            💡 Start ：
                                        </h4>
                                        <ul className="text-left space-y-1">
                                            <li>
                                                • Click the "New Project"
                                                button on the left
                                            </li>
                                            <li>• Enter project name</li>
                                            <li>
                                                •
                                                Start enjoying the new project management features!
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjTab;
