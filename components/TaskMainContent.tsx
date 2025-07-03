'use client';

import { useState, useEffect, useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { collection, doc } from "firebase/firestore";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { db } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SubmissionCard from "@/components/SubmissionCard";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Edit3, Target, CheckCircle2 } from "lucide-react";
import CommentBox from "@/components/CommentBox";
import { Comment, Task } from "@/types/types";
import CommentView from "@/components/CommentView";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTransition } from "react";
import { toast } from "sonner";
import { RootState } from "@/lib/store/store";
import { useSelector } from "react-redux";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskMainContentProps {
  projId: string;
  stageId: string;
  taskId: string;
  task: Task;
  taskLocked: boolean;
}

function TaskMainContent({ projId, stageId, taskId, task, taskLocked }: TaskMainContentProps) {
  const { user } = useUser();
  
  const [completionPercentage, setCompletionPercentage] = useState([0]);
  const [tempCompletionPercentage, setTempCompletionPercentage] = useState([0]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');

  const [publicComments, publicCommentsLoading, publicCommentsError] = useCollection(
    collection(db, 'projects', projId, 'stages', stageId, 'tasks', taskId, 'public')
  );

  const sortedPublicComments = useMemo(() => {
    if (!publicComments) return [];
    return publicComments.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data() as Comment
      }))
      .sort((a, b) => (a.time?.seconds || 0) - (b.time?.seconds || 0));
  }, [publicComments]);

  // Initialize temp completion percentage
  useEffect(() => {
    setTempCompletionPercentage(completionPercentage);
  }, [completionPercentage]);

  // Initialize completion data from task
  useEffect(() => {
    if (task) {
      const taskCompletion = task.completionPercentage || 0;
      setCompletionPercentage([taskCompletion]);
      setTempCompletionPercentage([taskCompletion]);
      setIsCompleted(task.isCompleted || taskCompletion === 100);
    }
  }, [task]);

  const handleMarkComplete = () => {
    if (!taskLocked) {
      setIsCompleted(true);
      setCompletionPercentage([100]);
      setTempCompletionPercentage([100]);
      setHasUnsavedChanges(false);
      toast.success('Task marked as complete!');
    } else {
      toast.info('This task is currently locked.');
    }
  };

  const handleProgressChange = (value: number[]) => {
    setTempCompletionPercentage(value);
    setHasUnsavedChanges(value[0] !== completionPercentage[0]);
  };

  const handleUpdateProgress = () => {
    if (!taskLocked) {
      setCompletionPercentage(tempCompletionPercentage);
      if (tempCompletionPercentage[0] === 100 && !isCompleted) {
        setIsCompleted(true);
        toast.success('🎉 Task marked as complete!');
      } else if (tempCompletionPercentage[0] < 100 && isCompleted) {
        setIsCompleted(false);
        toast.success('Progress updated!');
      } else if (tempCompletionPercentage[0] === 100) {
        toast.success('Task confirmed as complete!');
      } else {
        toast.success('Progress updated!');
      }
      setHasUnsavedChanges(false);
      setIsModifying(false);
    } else {
      toast.info('This task is currently locked.');
    }
  };

  const handleCancelModify = () => {
    setTempCompletionPercentage(completionPercentage);
    setHasUnsavedChanges(false);
    setIsModifying(false);
  };

  if (publicCommentsLoading) return <Skeleton className="w-full h-96" />;
  if (publicCommentsError) return <div>Error loading comments: {publicCommentsError.message}</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Left Side - Combined Progress + Proof of Completion */}
      <div className="lg:col-span-3">
        <Card>
          {/* Progress Section */}
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-[#6F61EF]" />
              <span>Task Progress</span>
              
              {/* Role toggle switch */}
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-lg">
                <span className="text-gray-500 text-sm font-medium">
                  {userRole === 'admin' ? 'Admin' : 'User'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:bg-gray-200 h-6 w-12 p-0 transition-colors"
                  onClick={() => {
                    setUserRole(userRole === 'admin' ? 'user' : 'admin');
                  }}
                >
                  <div className={`w-10 h-5 rounded-full transition-colors ${
                    userRole === 'admin' ? 'bg-purple-500' : 'bg-blue-500'
                  } relative`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform absolute top-0.5 ${
                      userRole === 'admin' ? 'transform translate-x-0.5' : 'transform translate-x-5'
                    }`} />
                  </div>
                </Button>
              </div>
              
              <div className={`ml-auto flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                isCompleted ? 'bg-green-100 text-green-700' : completionPercentage[0] > 50 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-6 bg-gradient-to-b from-[#6F61EF] to-purple-600 rounded-full"></div>
                <h3 className="text-xl font-semibold text-gray-800">Proof of Completion</h3>
              </div>
              {(userRole === 'admin' || task?.assignee === user?.emailAddresses?.[0]?.emailAddress) ? (
                <SubmissionCard 
                  projId={projId} 
                  stageId={stageId} 
                  taskId={taskId} 
                  task={task} 
                  taskLocked={taskLocked}
                />
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm">
                    You don't have permission to submit files for this task.
                    {task?.assignee ? ` This task is assigned to ${task.assignee}.` : ' This task is unassigned.'}
                  </p>
                </div>
              )}
              <Separator className="my-6" />
            </div>
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-700">Completion</Label>
                <span className="text-lg font-bold text-[#6F61EF]">{completionPercentage[0]}%</span>
              </div>
              
              <Progress 
                value={completionPercentage[0]} 
                className="h-3"
              />
              
              {/* Progress controls - only for admin or assigned user */}
              {(userRole === 'admin' || task?.assignee === user?.emailAddresses?.[0]?.emailAddress) ? (
                <>
                  {!isModifying ? (
                    /* View Mode */
                    <div className="space-y-4">
                      <Button 
                        onClick={() => setIsModifying(true)}
                        disabled={taskLocked}
                        variant="outline"
                        className="w-full"
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Modify Progress
                      </Button>
                      
                      {isCompleted && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsCompleted(false);
                            setCompletionPercentage([90]);
                            setTempCompletionPercentage([90]);
                            setHasUnsavedChanges(false);
                            toast.info('Task unmarked as complete');
                          }}
                          disabled={taskLocked}
                          className="w-full"
                        >
                          Restart Task
                        </Button>
                      )}
                    </div>
                  ) : (
                    /* Edit Mode */
                    <div className={`space-y-3 p-4 rounded-lg border-2 ${
                      tempCompletionPercentage[0] === 100 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex justify-between items-center">
                                                  <Label className={`text-sm font-medium ${
                            tempCompletionPercentage[0] === 100 ? 'text-green-700' : 'text-blue-700'
                          }`}>
                            {tempCompletionPercentage[0] === 100 ? 'Mark as complete' : 'Modify completion (0-100%)'}
                          </Label>
                        {hasUnsavedChanges && (
                          <span className={`text-sm font-bold ${
                            tempCompletionPercentage[0] === 100 ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {tempCompletionPercentage[0]}%
                          </span>
                        )}
                      </div>
                      
                      <Slider
                        value={tempCompletionPercentage}
                        onValueChange={handleProgressChange}
                        max={100}
                        step={5}
                        disabled={taskLocked}
                        className="w-full"
                      />
                      
                      <div className="flex space-x-2">
                        <Button 
                          onClick={handleCancelModify}
                          disabled={taskLocked}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleUpdateProgress}
                          disabled={taskLocked || !hasUnsavedChanges}
                          size="sm"
                          className={`flex-1 text-white ${
                            tempCompletionPercentage[0] === 100 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {tempCompletionPercentage[0] === 100 ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Mark as Complete
                            </>
                          ) : (
                            'Update Progress'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm">
                    You don't have permission to modify this task's progress.
                    {task?.assignee ? ` This task is assigned to ${task.assignee}.` : ' This task is unassigned.'}
                  </p>
                </div>
              )}
            
            
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Comments (1/4 width) */}
      <div className="lg:col-span-1">
        <Card className="bg-white h-auto">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-[#6F61EF]" />
                <span>Comments</span>
                <span className="text-sm font-normal text-gray-500">
                  ({sortedPublicComments.length})
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <Separator className="mx-6" />
          <CardContent className="pt-6">
            {/* Comments List */}
            <div className="space-y-4 max-h-96 overflow-y-auto mb-6 pr-2">
              {sortedPublicComments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                sortedPublicComments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                    <CommentView comment={comment} />
                  </div>
                ))
              )}
            </div>
            
            {/* Comment Input */}
            <div className="border-t pt-4">
              <CommentBox 
                isPublic={true} 
                projId={projId} 
                stageId={stageId} 
                taskId={taskId} 
                className="shadow-none border-0" 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TaskMainContent;