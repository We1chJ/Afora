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
} from "firebase/firestore";
import React, { useEffect, useState, useTransition } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import GenerateTeamsButton from "./GenerateTeamsButton";
import { Button } from "./ui/button";
import { updateProjects, createProject } from "@/actions/actions";
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

type MatchingOutput = {
    groupSize: number;
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
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [selectedView, setSelectedView] = useState<"overview" | "projects">(
        "overview",
    );
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
                        console.log("DEBUG - PROJECTS");
                        console.log(projects);
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

    const handleCreateProject = () => {
        if (!newProjectTitle.trim()) {
            toast.error("Please enter a project title");
            return;
        }

        startTransition(async () => {
            try {
                if (isMockMode) {
                    // For mock mode, just show success message
                    toast.success(
                        `Mock project "${newProjectTitle}" created successfully!`,
                    );
                } else {
                    // 调用真实的项目创建API
                    const result = await createProject(
                        orgId,
                        newProjectTitle,
                        [],
                    );

                    if (result.success) {
                        toast.success(
                            result.message ||
                                `Project "${newProjectTitle}" created successfully!`,
                        );
                        // 触发数据刷新
                        setRefreshTrigger((prev) => prev + 1);
                        // 关闭对话框
                        setIsNewProjectDialogOpen(false);
                        setNewProjectTitle("");
                    } else {
                        toast.error(
                            result.message || "Failed to create project",
                        );
                        return;
                    }
                }
                setNewProjectTitle("");
                setIsNewProjectDialogOpen(false);
            } catch (error) {
                console.error("Failed to create project:", error);
                toast.error(
                    "Failed to create project: " + (error as Error).message,
                );
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

    const selectedProjectData = allProjectsList.find(
        (proj) => proj.projId === selectedProject,
    );
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
                

                {/* Navigation */}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4">
                    {selectedView === "overview" ? (
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
                    ) : (
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-500">
                                Project List
                            </div>
                            {allProjectsList.length > 0 ? (
                                allProjectsList
                                    .sort((a, b) =>
                                        a.title.localeCompare(b.title),
                                    )
                                    .map((proj) => (
                                        <div
                                            key={proj.projId}
                                            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                                selectedProject === proj.projId
                                                    ? "bg-purple-50 border-2 border-purple-200 shadow-md"
                                                    : "bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-sm"
                                            }`}
                                            onClick={() =>
                                                setSelectedProject(proj.projId)
                                            }
                                        >
                                            <div className="flex items-center gap-3">
                                                <Folder
                                                    className={`h-5 w-5 ${
                                                        selectedProject ===
                                                        proj.projId
                                                            ? "text-purple-600"
                                                            : "text-gray-400"
                                                    }`}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div
                                                        className={`font-medium truncate ${
                                                            selectedProject ===
                                                            proj.projId
                                                                ? "text-purple-900"
                                                                : "text-gray-900"
                                                        }`}
                                                    >
                                                        {proj.title}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {proj.members?.length ||
                                                            0}{" "}
                                                        members
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <Badge
                                                        variant={
                                                            (proj.members
                                                                ?.length || 0) >
                                                            0
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {(proj.members
                                                            ?.length || 0) > 0
                                                            ? "Active"
                                                            : "Empty"}
                                                    </Badge>
                                                    {selectedProject ===
                                                        proj.projId && (
                                                        <ArrowRight className="h-4 w-4 text-purple-600" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="text-center py-8">
                                    <Folder className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm mb-3">
                                        {userRole === "admin"
                                            ? "No projects created yet"
                                            : "No projects assigned to you"}
                                    </p>
                                    {userRole === "admin" && (
                                        <p className="text-xs text-gray-400">
                                            Click "New Project" below to create
                                            your first project
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
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
                                                ? "创建第一个项目"
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
                                                    !newProjectTitle.trim()
                                                }
                                            >
                                                {isPending
                                                    ? "Creating..."
                                                    : "Create Project"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                {!output && totalProjects === 0 && (
                                    <GenerateTeamsButton
                                        setOutput={setOutput}
                                        orgId={orgId}
                                    />
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
                                    key={index}
                                    className="bg-white p-4 rounded-lg shadow-sm border"
                                >
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Group {index + 1}
                                    </h4>
                                    <ul className="space-y-1">
                                        {group.map((member, memberIndex) => (
                                            <li
                                                key={memberIndex}
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
                    {selectedView === "overview" ? (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Project Overview
                            </h3>
                            <p className="text-sm text-gray-500">
                                Manage and monitor all your projects
                            </p>
                        </div>
                    ) : selectedProject && selectedProjectData ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {selectedProjectData.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {selectedProjectData.members?.length || 0}{" "}
                                    team members
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        (selectedProjectData.members?.length ||
                                            0) > 0
                                            ? "default"
                                            : "secondary"
                                    }
                                >
                                    {(selectedProjectData.members?.length ||
                                        0) > 0
                                        ? "Active Project"
                                        : "Empty Project"}
                                </Badge>
                            </div>
                        </div>
                    ) : selectedView === "projects" ? (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Select Project
                            </h3>
                            <p className="text-sm text-gray-500">
                                Select a project from the left to view details
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Projects Dashboard
                            </h3>
                            <p className="text-sm text-gray-500">
                                Overview of all project activities
                            </p>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedView === "overview" ? (
                        <div className="space-y-6">
                            {allProjectsList.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allProjectsList
                                        .sort((a, b) =>
                                            a.title.localeCompare(b.title),
                                        )
                                        .map((proj) => (
                                            <div
                                                key={proj.projId}
                                                className="group"
                                            >
                                                <ProjectCard
                                                    orgId={orgId}
                                                    projId={proj.projId}
                                                    projectName={proj.title}
                                                    backgroundImage={""}
                                                    tasks={proj.tasks}
                                                    members={proj.members}
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
                                                    💡 快速开始：
                                                </h4>
                                                <ul className="text-left space-y-1">
                                                    <li>
                                                        • 点击左侧 "New Project"
                                                        按钮
                                                    </li>
                                                    <li>• 输入项目名称</li>
                                                    <li>
                                                        •
                                                        开始享受新的项目管理功能！
                                                    </li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : selectedProject && selectedProjectData ? (
                        <div className="space-y-6">
                            {/* Project Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5 text-purple-600" />
                                        Project Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                Project Name
                                            </h4>
                                            <p className="text-lg font-semibold">
                                                {selectedProjectData.title}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                Team Size
                                            </h4>
                                            <p className="text-lg font-semibold">
                                                {selectedProjectData.members
                                                    ?.length || 0}{" "}
                                                members
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Team Members */}
                            {selectedProjectData.members &&
                                selectedProjectData.members.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-5 w-5 text-blue-600" />
                                                Team Members
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-3">
                                                {selectedProjectData.members.map(
                                                    (
                                                        member: string,
                                                        index: number,
                                                    ) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                                        >
                                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                                                {member
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {member}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    Team Member
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                            {/* Project Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className="justify-start"
                                            asChild
                                        >
                                            <a
                                                href={`/org/${orgId}/proj/${selectedProject}`}
                                            >
                                                <FolderOpen className="h-4 w-4 mr-2" />
                                                View Project Details
                                            </a>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="justify-start"
                                            asChild
                                        >
                                            <a
                                                href={`/org/${orgId}/proj/${selectedProject}/team-score`}
                                            >
                                                <BarChart3 className="h-4 w-4 mr-2" />
                                                Team Analysis
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Select a project to view details
                            </h3>
                            <p className="text-gray-500">
                                Choose a project from the list to see detailed
                                information and team members.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjTab;
