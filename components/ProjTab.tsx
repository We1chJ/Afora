"use client";
import { db } from "@/firebase";
import { Project, Task } from "@/types/types";
import {collection, DocumentData, getDocs, query, where} from "firebase/firestore";
import React, { useEffect, useState, useTransition } from "react";
import { useCollection } from "react-firebase-hooks/firestore";
import { Button } from "./ui/button";
import { updateProjects, createProject } from "@/actions/actions";
import { toast } from "sonner";
import ProjectCard from "./ProjectCard";
import {Plus, Folder, Users, Briefcase} from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter} from "./ui/dialog";

type MatchingOutput = {
    groupSize: number;
    groups: string[][];
};

const ProjTab = ({
    orgId,
    userRole,
    userId,
}: {
    userId: string;
    userRole: string;
    orgId: string;
}) => {
    const [isPending, startTransition] = useTransition();
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [output, setOutput] = useState("");
    const [parsedOutput, setParsedOutput] = useState<MatchingOutput | null>(null);
    const [projectTasks, setProjectTasks] = useState<{[key: string]: Task[]}>({});

    const adminQ = query(collection(db, "projects"), where("orgId", "==", orgId));
    const [allProjects] = useCollection(adminQ);
    

    const userQ = query(
        collection(db, "users", userId, "projs"),
        where("orgId", "==", orgId),
    );
    const [userProjects, userLoading, userError] = useCollection(userQ);
    const [userProjList, setUserProjList] = useState<Project[]>([]);

    useEffect(() => {
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
                    try {
                        const projectDocs = await getDocs(
                            query(
                                collection(db, "projects"),
                                where("__name__", "in", projectIds),
                            ),
                        );
                        const projects = projectDocs.docs.map(
                            (doc) => ({
                                ...(doc.data() as Project),
                                projId: doc.id
                            }),
                            
                        );
                        setUserProjList(projects);
                    } catch (error) {
                        console.error("Error fetching user projects:", error);
                        toast.error("Failed to fetch your projects");
                    }
                }
            } else if (
                !userLoading &&
                !userError &&
                (!userProjects || userProjects.docs.length === 0)
            ) {
                setUserProjList([]);
            }
        };
        fetchProjects();
    }, [userProjects, userLoading, userError]);

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

    const allProjectsList: Project[] = userRole === "admin"
    ? (allProjects?.docs || []).map((doc: DocumentData) => ({
        ...(doc.data() as Project),
        projId: doc.id,
    }))
    : userProjList;

    // 获取所有项目的任务
    useEffect(() => {
        const fetchProjectTasks = async () => {
            const tasksMap: {[key: string]: Task[]} = {};
            
            for (const project of allProjectsList) {
                if (!project.projId) {
                    console.error("Project missing projId:", project);
                    continue;
                }
                
                try {
                    // 获取项目的所有阶段
                    const stagesSnapshot = await getDocs(
                        collection(db, "projects", project.projId, "stages")
                    );
                    
                    let projectTasksList: Task[] = [];
                    
                    // 获取每个阶段的任务
                    for (const stageDoc of stagesSnapshot.docs) {
                        const tasksSnapshot = await getDocs(
                            collection(db, "projects", project.projId, "stages", stageDoc.id, "tasks")
                        );
                        
                        const stageTasks = tasksSnapshot.docs.map(doc => ({
                            ...(doc.data() as Task),
                            id: doc.id
                        }));
                        
                        projectTasksList = [...projectTasksList, ...stageTasks];
                    }
                    
                    tasksMap[project.projId] = projectTasksList;
                } catch (error) {
                    console.error(`Error fetching tasks for project ${project.projId}:`, error);
                    tasksMap[project.projId] = [];
                }
            }
            
            setProjectTasks(tasksMap);
        };

        if (allProjectsList.length > 0) {
            fetchProjectTasks();
        }
    }, [allProjectsList]);

    const totalProjects = allProjectsList.length;
    const activeProjects = allProjectsList.filter(
        (proj: Project) => proj.members && proj.members.length > 0,
    ).length;

    const handleAccept = () => {
        if (parsedOutput) {
            startTransition(async () => {
                try {
                    await updateProjects(orgId, parsedOutput.groups);
                    toast.success("Groups updated successfully");
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
                    setRefreshTrigger((prev: number) => prev + 1);
                    setIsNewProjectDialogOpen(false);
                    setNewProjectTitle("");
                } else {
                    toast.error(
                        result.message || "Failed to create project",
                    );
                    return;
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
                                                variant={userRole === "admin" ? "destructive" : "secondary"}
                                            >
                                                {userRole === "admin" ? "Admin" : "Member"}
                                            </Badge>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">
                                                Total Members
                                            </span>
                                            <Badge variant="outline">
                                                {allProjectsList.reduce((total: number, proj: Project) => total + (proj.members?.length || 0), 0)}
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
                    <h3 className="text-lg font-semibold text-gray-900">
                        Project Overview
                    </h3>
                    <p className="text-sm text-gray-500">
                        Manage and monitor all your projects
                    </p>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
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
                                                    members={proj.members}
                                                    tasks={projectTasks[proj.projId] || []}
                                                />
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 max-w-md mx-auto">
                                        <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            {userRole === "admin"
                                                ? "Welcome to Project Management!"
                                                : "No projects assigned"}
                                        </h3>
                                        <p className="text-gray-500 mb-4">
                                            {userRole === "admin"
                                                ? "Start creating your first project, experience the new task pool management system"
                                                : "Wait for admins to create projects and assign you"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                </div>
            </div>
        </div>
    );
};

export default ProjTab;
