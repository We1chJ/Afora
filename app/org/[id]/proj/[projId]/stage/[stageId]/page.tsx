'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { db } from "@/firebase";
import { Stage, Task } from "@/types/types";
import { collection, doc } from "firebase/firestore";
import PieChartProgress from "@/components/PieChartProgress";
import TaskPool from "@/components/TaskPool";
import { CircleCheckBig, Clock7, Trash, Edit3, Trophy, BarChart3 } from "lucide-react";
import { createTask, deleteTask } from "@/actions/actions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner";

function StagePage({ params: { id, projId, stageId } }: {
  params: {
    id: string;
    projId: string;
    stageId: string;
  }
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [isMockMode, setIsMockMode] = useState(false);
  const [mockTasks, setMockTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Check if mock mode
  useEffect(() => {
    if (id === 'mock-org-123') {
      setIsMockMode(true);
      // Create mock tasks with task pool features
      const mockTasksData: Task[] = [
        {
          id: 'task-1',
          title: 'Design Database Schema',
          description: 'Create a comprehensive database schema for the project',
          soft_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          hard_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          assignee: 'alice@test.com',
          order: 0,
          isCompleted: true,
          points: 1,
          status: 'completed',
          assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'task-2',
          title: 'Implement User Authentication',
          description: 'Set up secure user authentication and authorization system',
          soft_deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          hard_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          assignee: 'bob@test.com',
          order: 1,
          isCompleted: false,
          points: 1,
          status: 'assigned',
          assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'task-3',
          title: 'Create API Documentation',
          description: 'Document all API endpoints with examples and schemas',
          soft_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          hard_deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
          assignee: '',
          order: 2,
          isCompleted: false,
          points: 1,
          status: 'available',
        },
        {
          id: 'task-4',
          title: 'Setup CI/CD Pipeline',
          description: 'Configure automated testing and deployment pipeline',
          soft_deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (overdue)
          hard_deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
          assignee: 'charlie@test.com',
          order: 3,
          isCompleted: false,
          points: 1,
          status: 'overdue',
          assignedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          canBeReassigned: true,
        },
        {
          id: 'task-5',
          title: 'Write Unit Tests',
          description: 'Create comprehensive unit tests for all components',
          soft_deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
          hard_deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
          assignee: '',
          order: 4,
          isCompleted: false,
          points: 1,
          status: 'available',
        }
      ];
      setMockTasks(mockTasksData);
    }
  }, [id, projId, stageId]);

  const [isPending, startTransition] = useTransition();
  const [stageData, stageLoading, stageError] = useDocument(isMockMode ? null : doc(db, 'projects', projId, 'stages', stageId));
  const [tasksData, tasksLoading, tasksError] = useCollection(isMockMode ? null : collection(db, 'projects', projId, 'stages', stageId, 'tasks'));
  
  const tasks: Task[] = useMemo(() => {
    if (isMockMode) {
      return mockTasks;
    }
    return tasksData?.docs.map(doc => ({
      ...(doc.data() as Task)
    })).sort((a, b) => a.order - b.order) || [];
  }, [tasksData, isMockMode, mockTasks]);

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Mock stage data
  const mockStage: Stage = {
    id: stageId,
    title: 'Requirements Analysis & Design',
    order: 0,
    tasksCompleted: mockTasks.filter(t => t.isCompleted).length,
    totalTasks: mockTasks.length
  };

  if (!isSignedIn) return null;

  if (isMockMode) {
    // Mock mode loading simulation
    if (mockTasks.length === 0) {
      return <Skeleton className="w-full h-96" />;
    }
  } else {
    if (stageLoading || tasksLoading) {
      return <Skeleton className="w-full h-96" />;
    }

    if (stageError) {
      return <div>Error: {stageError.message}</div>;
    }

    if (tasksError) {
      return <div>Error: {tasksError.message}</div>;
    }
  }

  const stage = isMockMode ? mockStage : stageData?.data() as Stage;

  if (!stage) {
    return <div>Error: The stage has been deleted.</div>;
  }

  const tasksCompleted = tasks.filter(task => task.isCompleted).length;

  const handleNewTask = () => {
    if (isMockMode) {
      toast.success("Task created successfully! (Mock mode)");
      return;
    }
    
    createTask(projId, stageId, tasks.length + 1)
      .then(() => {
        toast.success("Task created successfully!");
      })
      .catch((error) => {
        toast.error("Failed to create task: " + error.message);
      });
  }

  const handleDeleteTask = (taskId: string) => {
    startTransition(() => {
      if (isMockMode) {
        toast.success("Task deleted successfully! (Mock mode)");
        setIsOpen(false);
        setIsEditing(false);
        return;
      }

      deleteTask(projId, stageId, taskId)
        .then(() => {
          toast.success("Task deleted successfully!");
        })
        .catch((error) => {
          toast.error("Failed to delete task: " + error.message);
        })
        .finally(() => {
          setIsOpen(false);
          setIsEditing(false);
        });
    });
  };

  // Task pool handlers
  const handleTaskAssign = async (taskId: string, userId: string) => {
    if (isMockMode) {
      // Update mock data
      setMockTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, assignee: userId, status: 'assigned' as const, assignedAt: new Date().toISOString() }
          : task
      ));
      return;
    }
    
    // TODO: Implement real task assignment
    // Example API call:
    // await fetch(`/api/tasks/${taskId}/assign`, {
    //   method: 'POST',
    //   body: JSON.stringify({ userId }),
    //   headers: { 'Content-Type': 'application/json' }
    // });
  };

  const handleTaskUnassign = async (taskId: string) => {
    if (isMockMode) {
      // Update mock data
      setMockTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, assignee: '', status: 'available' as const, assignedAt: undefined }
          : task
      ));
      return;
    }
    
    // TODO: Implement real task unassignment
    // await fetch(`/api/tasks/${taskId}/unassign`, { method: 'POST' });
  };

  const handleTaskComplete = async (taskId: string) => {
    if (isMockMode) {
      // Update mock data
      setMockTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, isCompleted: true, status: 'completed' as const, completedAt: new Date().toISOString() }
          : task
      ));
      return;
    }
    
    // TODO: Implement real task completion
    // await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' });
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#6F61EF] to-purple-600 shadow-lg">
        <div className="px-4 md:px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title Section */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {'Stage ' + (stage.order + 1) + '. ' + stage.title}
                </h1>
                <div className="flex items-center gap-2">
                  <Link href={`/org/${id}/proj/${projId}/leaderboard`}>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                        <Trophy className="h-4 w-4 mr-1" />
                        Leaderboard
                      </Button>
                    </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-white/10" 
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-white">
                Tasks & Task Pool
              </h2>
            </div>
          
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tasks">Task Management</TabsTrigger>
            <TabsTrigger value="pool">Task Pool</TabsTrigger>
          </TabsList>

          {/* Traditional Task Management View */}
          <TabsContent value="tasks" className="mt-0">
            <div className="grid grid-cols-2 gap-4">
              {tasks.map((task, index) => (
                <div key={index} className="flex flex-1">
                  <Link
                    className="flex flex-1"
                    href={`/org/${id}/proj/${projId}/stage/${stageId}/task/${task.id}`}
                    onClick={(e) => isEditing && e.preventDefault()}
                  >
                    <Card className="w-full shadow-lg hover:shadow-3xl hover:translate-y-[-4px] transition-transform duration-300 h-auto">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <span className="text-lg">{index + 1}. {task.title}</span>
                          <div className="flex items-center gap-2">
                            {task.isCompleted ? (
                              <CircleCheckBig className="text-green-500" />
                            ) : (
                              <Clock7 className="text-yellow-500" />
                            )}
                            {isEditing && (
                              <AlertDialog open={isOpen}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="text-red-500"
                                    onClick={() => setIsOpen(true)}
                                  >
                                    <Trash />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this task? This action cannot be undone!
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <Button variant="secondary" onClick={() => setIsOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => { handleDeleteTask(task.id) }}
                                      disabled={isPending}
                                    >
                                      {isPending ? <Clock7 className="animate-spin" /> : "Delete"}
                                    </Button>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                </div>
              ))}
              
              {(isEditing || tasks.length == 0) && (
                <div className="col-span-full">
                  <div className="w-full flex-1 p-4 bg-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <Button
                        variant="ghost"
                        className="w-full flex justify-between items-center"
                        onClick={handleNewTask}
                      >
                        <span className="w-full text-lg font-semibold text-gray-500">
                          + New Task
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Task Pool View */}
          <TabsContent value="pool" className="mt-4">
            <TaskPool
              stageId={stageId}
              projId={projId}
              tasks={tasks}
              isMockMode={isMockMode}
              onTaskAssign={handleTaskAssign}
              onTaskUnassign={handleTaskUnassign}
              onTaskComplete={handleTaskComplete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default StagePage;