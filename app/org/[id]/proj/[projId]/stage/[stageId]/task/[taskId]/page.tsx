'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/firebase";
import { useAuth, useUser } from "@clerk/nextjs";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDocument } from "react-firebase-hooks/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit3, Clock, User, Calendar, UserPlus, CheckCircle, Upload, Target, Star, Trophy, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Task } from "@/types/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTransition } from "react";
import { 
  getStageLockStatus, 
  updateTask, 
  assignTask, 
  completeTaskWithProgress, 
  submitTask, 
  getTaskSubmissions 
} from "@/actions/actions";
import { toast } from "sonner";
import { RootState } from "@/lib/store/store";
import { useDispatch, useSelector } from "react-redux";
import { updateStatus } from "@/lib/store/features/stageStatus/stageStatusSlice";
import TaskMainContent from "@/components/TaskMainContent";

function TaskPage({ params: { id, projId, stageId, taskId } }: {
  params: {
    id: string;
    projId: string;
    stageId: string;
    taskId: string;
  }
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const stageStatus: boolean[] = useSelector((state: RootState) => state.stageStatus.status);
  const [taskLocked, setTaskLocked] = useState(false);
  const [stageData, stageLoading, stageError] = useDocument(doc(db, 'projects', projId, 'stages', stageId));
  const dispatch = useDispatch();
  
  // 新增任务池相关状态
  const [assigneeEmail, setAssigneeEmail] = useState('');
  const [submissionContent, setSubmissionContent] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  // 用户角色状态
  const [userRole, setUserRole] = useState<'admin' | 'member' | null>(null);
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  
  useEffect(() => {
    // check to make sure update lock status at least once
    // in case user jumps directly to this page without going through project page
    const fetchStageLockStatus = async () => {
      const status: boolean[] = await getStageLockStatus(projId);
      dispatch(updateStatus(status));
    };
    fetchStageLockStatus();
  }, [projId, dispatch]);

  useEffect(() => {
    if (stageData) {
      const stage = stageData.data();
      if (stage) {
        console.log('setting status');
        setTaskLocked(stageStatus[stage.order]);
      }
    }
  }, [stageData, stageLoading, stageError, stageStatus]);

  useEffect(() => {
    if (taskLocked) {
      toast.info('This task is currently locked. Try helping others with their tasks first!');
    }
  }, [taskLocked]);

  const handleSaveTaskEdits = () => {
    const title = (document.getElementById('title') as HTMLInputElement).value;
    const description = (document.getElementById('description') as HTMLTextAreaElement).value;
    const softDeadline = (document.getElementById('soft_deadline') as HTMLInputElement).value;
    const hardDeadline = (document.getElementById('hard_deadline') as HTMLInputElement).value;
    const points = parseInt((document.getElementById('points') as HTMLInputElement)?.value || '1');
    
    const validateDate = (date: string) => {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      return regex.test(date);
    };

    if (!validateDate(softDeadline) || !validateDate(hardDeadline)) {
      toast.error('Please enter valid dates in the format of yyyy-mm-dd for both deadlines.');
      return;
    }
    startTransition(async () => {
      await updateTask(projId, stageId, taskId, title, description, softDeadline, hardDeadline, points)
        .then(() => {
          toast.success('Task updated successfully!');
          setIsEditing(false);
        })
        .catch((error) => {
          toast.error(`Failed to update task: ${error.message}`);
        });
    });
  };

  // 处理任务分配
  const handleAssignTask = async () => {
    if (!assigneeEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    startTransition(async () => {
      try {
        const result = await assignTask(projId, stageId, taskId, assigneeEmail);
        if (result.success) {
          toast.success('Task assigned successfully!');
          setShowAssignDialog(false);
          setAssigneeEmail('');
        } else {
          toast.error(result.message || 'Failed to assign task');
        }
      } catch (error) {
        toast.error('Failed to assign task');
        console.error(error);
      }
    });
  };

  // 处理任务完成
  const handleCompleteTask = async () => {
    startTransition(async () => {
      try {
        const result = await completeTaskWithProgress(projId, stageId, taskId, completionPercentage);
        if (result.success) {
          toast.success(`Task progress updated! ${result.points_earned ? `Earned ${result.points_earned} points` : ''}`);
        } else {
          toast.error(result.message || 'Failed to update task progress');
        }
      } catch (error) {
        toast.error('Failed to update task progress');
        console.error(error);
      }
    });
  };

  // 处理任务提交
  const handleSubmitTask = async () => {
    if (!submissionContent.trim()) {
      toast.error('Please enter submission content');
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitTask(projId, stageId, taskId, submissionContent);
        if (result.success) {
          toast.success('Task submitted successfully!');
          setShowSubmissionDialog(false);
          setSubmissionContent('');
          loadSubmissions(); // 重新加载提交记录
        } else {
          toast.error(result.message || 'Failed to submit task');
        }
      } catch (error) {
        toast.error('Failed to submit task');
        console.error(error);
      }
    });
  };

  // 加载任务提交记录
  const loadSubmissions = async () => {
    try {
      const result = await getTaskSubmissions(projId, stageId, taskId);
      if (result.success) {
        setSubmissions(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    }
  };

  // 加载提交记录
  useEffect(() => {
    loadSubmissions();
  }, [projId, stageId, taskId]);

  // 获取用户角色
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userEmail || !id) return;
      
      try {
        // 获取组织数据
        const orgDoc = await import('firebase/firestore').then(({ doc, getDoc }) => 
          getDoc(doc(db, 'organizations', id))
        );
        
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const isAdmin = orgData?.admins?.includes(userEmail);
          const isMember = orgData?.members?.includes(userEmail);
          
          if (isAdmin) {
            setUserRole('admin');
          } else if (isMember) {
            setUserRole('member');
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, [userEmail, id]);

  const [taskData, taskLoading, taskError] = useDocument(doc(db, 'projects', projId, 'stages', stageId, 'tasks', taskId));
  const task = taskData?.data() as Task;

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, projId, stageId, router]);

  if (!user || taskLoading) return <Skeleton className="w-full h-96" />;
  if (taskError) return <div>Error: {taskError.message}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {isSignedIn && (
        <div className="container mx-auto px-4 py-8 max-w-8xl">
          {/* Header Section */}
          <div className="mb-8">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-[#6F61EF] to-purple-600 text-white overflow-hidden">
              <CardHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold mb-3">
                      {task?.title || "Task Title"}
                    </CardTitle>
                    <p className="text-white/90 text-lg mb-4 leading-relaxed">
                      {task?.description || "No description available"}
                    </p>
                    
                    {/* Task Meta Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Assigned to:</span>
                        <span>{task?.assignee || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Soft Deadline:</span>
                        <span>{task?.soft_deadline || "None"}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Hard Deadline:</span>
                        <span>{task?.hard_deadline || "None"}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                        <Star className="h-4 w-4" />
                        <span className="font-medium">Points:</span>
                        <span>{task?.points || 1}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Drawer open={isEditing}>
                    <DrawerTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/20" 
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit Task
                      </Button>
                    </DrawerTrigger>
                      <DrawerContent className="p-6 w-full h-5/6">
                        <DrawerTitle className="text-2xl font-bold mb-2">📝 Edit Task</DrawerTitle>
                        <DrawerDescription className="text-gray-600 mb-6">
                          Please edit the task information below
                        </DrawerDescription>
                        <div className="space-y-6">
                          <div>
                            <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2 block">
                              Task Title
                            </Label>
                            <Input
                              type="text"
                              id="title"
                              name="title"
                              defaultValue={task?.title}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 block">
                              Task Description
                            </Label>
                            <Textarea
                              id="description"
                              name="description"
                              defaultValue={task?.description}
                              rows={4}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label htmlFor="assignee" className="text-sm font-semibold text-gray-700 mb-2 block">
                              Assignee
                            </Label>
                            <Input
                              type="text"
                              id="assignee"
                              name="assignee"
                              defaultValue={task?.assignee || "Unassigned"}
                              className="w-full"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="soft_deadline" className="text-sm font-semibold text-gray-700 mb-2 block">
                                Soft Deadline
                              </Label>
                              <Input
                                type="date"
                                id="soft_deadline"
                                name="soft_deadline"
                                defaultValue={task?.soft_deadline || ""}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor="hard_deadline" className="text-sm font-semibold text-gray-700 mb-2 block">
                                Hard Deadline
                              </Label>
                              <Input
                                type="date"
                                id="hard_deadline"
                                name="hard_deadline"
                                defaultValue={task?.hard_deadline || ""}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label htmlFor="points" className="text-sm font-semibold text-gray-700 mb-2 block">
                                Points
                              </Label>
                              <Input
                                type="number"
                                id="points"
                                name="points"
                                min="1"
                                max="10"
                                defaultValue={task?.points || 1}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                        <DrawerFooter className="flex flex-row justify-end space-x-4 pt-6">
                          <DrawerClose asChild>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                              Cancel
                            </Button>
                          </DrawerClose>
                          <Button onClick={handleSaveTaskEdits} disabled={isPending}>
                            {isPending ? 'Saving...' : 'Save'}
                          </Button>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Main Content */}
          <TaskMainContent 
                      projId={projId}
                      stageId={stageId} 
                      taskId={taskId}
                      task={task}
                      taskLocked={taskLocked}
                    />

          {/* Task Pool Management Section */}
          {userRole === 'admin' && (
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Status & Actions */}
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Task Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Task Status */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant={task?.status === 'completed' ? 'default' : 'outline'}>
                    {task?.status || 'available'}
                  </Badge>
                </div>
                
                {/* Task Progress */}
                  {task?.completionPercentage !== undefined && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Progress:</span>
                        <span className="text-sm text-gray-600">{task.completionPercentage}%</span>
                      </div>
                      <Progress value={task.completionPercentage} className="w-full" />
                    </div>
                  )}

                {/* Points */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">Points:</span>
                  <Badge variant="secondary">{task?.points || 1} pts</Badge>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Assign Task */}
                  <Drawer open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                    <DrawerTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Task
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="p-6">
                      <DrawerTitle>Assign Task</DrawerTitle>
                      <DrawerDescription>Enter the email address of the user to assign this task to.</DrawerDescription>
                      <div className="space-y-4 mt-4">
                        <Input
                          placeholder="user@example.com"
                          value={assigneeEmail}
                          onChange={(e) => setAssigneeEmail(e.target.value)}
                        />
                      </div>
                      <DrawerFooter className="flex flex-row justify-end space-x-4">
                        <DrawerClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                        <Button onClick={handleAssignTask} disabled={isPending}>
                          {isPending ? 'Assigning...' : 'Assign'}
                        </Button>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>

                  {/* Complete Task */}
                  {task?.assignee === user?.primaryEmailAddress?.emailAddress && !task?.isCompleted && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={completionPercentage}
                          onChange={(e) => setCompletionPercentage(parseInt(e.target.value) || 0)}
                          placeholder="Progress %"
                          className="flex-1"
                        />
                        <Button onClick={handleCompleteTask} disabled={isPending}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Update
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Submit Task */}
                  {task?.assignee === user?.primaryEmailAddress?.emailAddress && (
                    <Drawer open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
                      <DrawerTrigger asChild>
                        <Button className="w-full" variant="default">
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Work
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="p-6">
                        <DrawerTitle>Submit Task</DrawerTitle>
                        <DrawerDescription>Describe what you've accomplished or provide your submission details.</DrawerDescription>
                        <div className="space-y-4 mt-4">
                          <Textarea
                            placeholder="Describe your work, provide links, or share relevant details..."
                            value={submissionContent}
                            onChange={(e) => setSubmissionContent(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <DrawerFooter className="flex flex-row justify-end space-x-4">
                          <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DrawerClose>
                          <Button onClick={handleSubmitTask} disabled={isPending}>
                            {isPending ? 'Submitting...' : 'Submit'}
                          </Button>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submissions History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-green-600" />
                  Submission History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {submissions.map((submission, index) => (
                      <div key={submission.id || index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{submission.user_email}</span>
                          <span className="text-xs text-gray-500">
                            {submission.submitted_at ? new Date(submission.submitted_at.toDate()).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{submission.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Upload className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No submissions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}
          
        </div>
      )}
    </div>
  );
}

export default TaskPage;
