'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/firebase";
import { useAuth, useUser } from "@clerk/nextjs";
import { collection, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SubmissionCard from "@/components/SubmissionCard";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Edit3, Clock, User, Calendar } from "lucide-react";
import CommentBox from "@/components/CommentBox";
import { Comment, Task } from "@/types/types";
import CommentView from "@/components/CommentView";
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
import { getStageLockStatus, updateTask } from "@/actions/actions";
import { toast } from "sonner";
import { RootState } from "@/lib/store/store";
import { useDispatch, useSelector } from "react-redux";
import { updateStatus } from "@/lib/store/features/stageStatus/stageStatusSlice";

function TaskPage({ params: { projId, stageId, taskId } }: {
  params: {
    id: string;
    projId: string;
    stageId: string;
    taskId: string
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
  
  useEffect(() => {
    // check to make sure update lock status at least once
    // in case user jumps directly to this page without going through project page
    const fetchStageLockStatus = async () => {
      const status: boolean[] = await getStageLockStatus(projId);
      dispatch(updateStatus(status));
    };
    fetchStageLockStatus();
  }, []);

  useEffect(() => {
    if (stageData) {
      const stage = stageData.data();
      if (stage) {
        console.log('setting status');
        setTaskLocked(stageStatus[stage.order]);
      }
    }
  }, [stageData, stageLoading, stageError]);

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
    const validateDate = (date: string) => {
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      return regex.test(date);
    };

    if (!validateDate(softDeadline) || !validateDate(hardDeadline)) {
      toast.error('Please enter valid dates in the format of yyyy-mm-dd for both deadlines.');
      return;
    }
    startTransition(async () => {
      await updateTask(projId, stageId, taskId, title, description, softDeadline, hardDeadline)
        .then(() => {
          toast.success('Task updated successfully!');
          setIsEditing(false);
        })
        .catch((error) => {
          toast.error(`Failed to update task: ${error.message}`);
        });
    });
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, projId, stageId]);

  const [taskData, taskLoading, taskError] = useDocument(doc(db, 'projects', projId, 'stages', stageId, 'tasks', taskId));
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

  if (publicCommentsLoading) return <Skeleton className="w-full h-96" />;
  if (publicCommentsError) return <div>Error loading comments: {publicCommentsError.message}</div>;
  if (!user || taskLoading) return <Skeleton className="w-full h-96" />;
  if (taskError) return <div>Error: {taskError.message}</div>;

  const task = taskData?.data() as Task;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {isSignedIn && (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Main Content - Left/Right Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Side - Submission/Results */}
            <div className="lg:col-span-7">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                    <div className="w-2 h-6 bg-gradient-to-b from-[#6F61EF] to-purple-600 rounded-full"></div>
                    <span>Submissions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <SubmissionCard projId={projId} stageId={stageId} taskId={taskId} task={task} taskLocked={taskLocked} />
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Comments */}
            <div className="lg:col-span-5">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm h-fit">
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
        </div>
      )}
    </div>
  );
}

export default TaskPage;