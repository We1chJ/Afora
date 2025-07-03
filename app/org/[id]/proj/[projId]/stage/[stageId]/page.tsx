'use client';


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

import { CircleCheckBig, Clock7, Trash, Edit3, AlertTriangle, DollarSign } from "lucide-react";
import BountyBoardButton from "@/components/BountyBoardButton";
import TaskManagement from "@/components/TaskManagement";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
          completionPercentage: 100,
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
          completionPercentage: 75,
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
          completionPercentage: 0,
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
          completionPercentage: 30,
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
          completionPercentage: 0,
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
  const [bountyBoardOpen, setBountyBoardOpen] = useState(false);

  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');
  const [currentUserEmail, setCurrentUserEmail] = useState('admin@test.com');

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
  
  // Get overdue tasks for bounty board
  const overdueTasks = tasks.filter(task => {
    if (task.isCompleted) return false;
    const softDeadline = new Date(task.soft_deadline);
    const now = new Date();
    return now > softDeadline;
  });

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



  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      {/* Header Section - 类似项目页面的设计风格 */}
      <div className="relative">
        <div 
          className="bg-gradient-to-r from-[#6F61EF] to-purple-600 h-64 flex items-center justify-center bg-cover bg-center"
          style={{ 
            backgroundImage: `linear-gradient(135deg, #6F61EF 0%, #8B7ED8 50%, #B794F6 100%)`,
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        >
          {/* 半透明卡片 - 类似项目页面的设计 */}
          <div 
            className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 m-6 w-full max-w-8xl"
            style={{ 
              background: 'rgba(255,255,255,0.15)', 
              WebkitBackdropFilter: 'blur(10px)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Stage信息部分 */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {'Stage ' + (stage.order + 1) + '. ' + stage.title}
                  </h1>
                  <div className="flex items-center gap-3">
                    {/* 角色切换开关 */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg">
                      <span className="text-white text-sm font-medium">
                        {userRole === 'admin' ? 'Admin' : 'User'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20 h-6 w-12 p-0 transition-colors"
                        onClick={() => {
                          const newRole = userRole === 'admin' ? 'user' : 'admin';
                          setUserRole(newRole);
                          if (newRole === 'user') {
                            setCurrentUserEmail('bob@test.com'); // 模拟普通用户
                          } else {
                            setCurrentUserEmail('admin@test.com');
                          }

                        }}
                      >
                        <div className={`w-10 h-5 rounded-full transition-colors ${
                          userRole === 'admin' ? 'bg-blue-500' : 'bg-green-500'
                        } relative`}>
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-0.5 ${
                            userRole === 'admin' ? 'transform translate-x-0.5' : 'transform translate-x-5'
                          }`} />
                        </div>
                      </Button>
                    </div>

                    <BountyBoardButton
                      overdueTasks={overdueTasks.length}
                      showBountyBoard={false}
                      onClick={() => setBountyBoardOpen(true)}
                    />
                    {userRole === 'admin' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-white hover:bg-white/20 transition-colors" 
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl md:text-2xl font-semibold text-white">
                    Tasks List
                  </h2>
                </div>          
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-6">
        {/* Bounty Board Dialog */}
        <Dialog open={bountyBoardOpen} onOpenChange={setBountyBoardOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Bounty Board - Overdue Tasks
                <span className="text-sm font-normal text-gray-600">
                  ({overdueTasks.length} tasks available)
                </span>
              </DialogTitle>
              <DialogDescription>
                These tasks are overdue and available for anyone to claim. Complete them to earn points!
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {overdueTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overdueTasks.map((task, index) => (
                    <div key={task.id} className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200 hover:border-orange-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 flex-1">{task.title}</h3>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            1 Point
                          </span>
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            Overdue
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Due:</span> {new Date(task.soft_deadline).toLocaleDateString()}
                        </div>
                        <Link href={`/org/${id}/proj/${projId}/stage/${stageId}/task/${task.id}`}>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => setBountyBoardOpen(false)}>
                            Claim Task
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No overdue tasks available</p>
                  <p className="text-sm">All tasks are on track! 🎉</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Task Management Component */}
        <TaskManagement
          tasks={tasks}
          isEditing={isEditing}
          handleNewTask={handleNewTask}
          handleDeleteTask={handleDeleteTask}
          isPending={isPending}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          orgId={id}
          projId={projId}
          stageId={stageId}
          userRole={userRole}
          currentUserEmail={currentUserEmail}
        />
      </div>
    </div>
  );
}

export default StagePage;