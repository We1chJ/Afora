'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/firebase";
import { useAuth, useUser } from "@clerk/nextjs";
import { collection, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { Card, CardContent } from "@/components/ui/card";
import SubmissionCard from "@/components/SubmissionCard";
import { Separator } from "@/components/ui/separator";
import { UserRoundPen, Users, ChevronDown, ChevronUp, Edit3 } from "lucide-react";
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
  const [showPrivateComments, setShowPrivateComments] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);

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
      toast.info('This task is currently locked. Try help others on their tasks first!');
    }
  }, [taskLocked]);

  const handleSaveTaskEdits = () => {
    const title = (document.getElementById('title') as HTMLInputElement).value;
    const description = (document.getElementById('description') as HTMLTextAreaElement).value;
    const assignedTo = (document.getElementById('assignedTo') as HTMLInputElement).value;

    startTransition(async () => {
      await updateTask(projId, stageId, taskId, title, description, assignedTo)
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
  const [privateComments, privateCommentsLoading, privateCommentsError] = useCollection(
    collection(db, 'projects', projId, 'stages', stageId, 'tasks', taskId, 'private')
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

  const sortedPrivateComments = useMemo(() => {
    if (!privateComments) return [];
    return privateComments.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data() as Comment
      }))
      .sort((a, b) => (a.time?.seconds || 0) - (b.time?.seconds || 0));
  }, [privateComments]);

  if (publicCommentsLoading || privateCommentsLoading) return <Skeleton className="w-full h-96" />;
  if (publicCommentsError) return <div>Error loading public comments: {publicCommentsError.message}</div>;
  if (privateCommentsError) return <div>Error loading private comments: {privateCommentsError.message}</div>;
  if (!user || taskLoading) return <Skeleton className="w-full h-96" />;
  if (taskError) return <div>Error: {taskError.message}</div>;

  const task = taskData?.data() as Task;

  return (
    <div className="min-h-screen w-full pb-20">
      {isSignedIn && (
        <div className="p-4 md:p-6">
          <div className="space-y-4 md:space-y-8">
            {/* Task Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-8">
              <div className="col-span-1 md:col-span-5">
                <Card className="w-full bg-[#6F61EF] hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 md:p-6 space-y-4 md:space-y-8">
                    <div className="flex justify-between items-center">
                      <h1 className="text-2xl md:text-4xl font-bold text-white">
                        {task?.title || "Task Title"}
                      </h1>
                      <Drawer open={isEditing}>
                        <DrawerTrigger asChild>
                          <Button variant="ghost" className="text-white" onClick={() => setIsEditing(true)}>
                            Edit
                            <Edit3 />
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent className="p-4 w-full h-3/4">
                          <DrawerTitle className="w-full text-xl">📝 Task Editor</DrawerTitle>
                          <DrawerDescription className="w-full text-lg">
                            Please edit your task below
                          </DrawerDescription>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Title
                              </Label>
                              <Input
                                type="text"
                                id="title"
                                name="title"
                                defaultValue={task?.title}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                              </Label>
                              <Textarea
                                id="description"
                                name="description"
                                defaultValue={task?.description}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                                Assigned To
                              </Label>
                              <Input
                                type="text"
                                id="assignedTo"
                                name="assignedTo"
                                defaultValue={task?.assignedTo}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>
                          </div>
                          <DrawerFooter className="w-full">
                            <div className="w-full flex justify-center space-x-2">
                              <DrawerClose asChild>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                              </DrawerClose>
                              <Button variant="default" onClick={handleSaveTaskEdits} disabled={isPending}>
                                {isPending ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                    </div>
                    <p className="text-sm text-white mt-2">
                      {task?.description || "No description available"}
                    </p>
                    <div className="text-sm text-white">
                      <strong>Assigned to:</strong> {task?.assignedTo || "No assignee"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Submission Card - Collapsible on Mobile */}
              <div className="col-span-1 md:col-span-2">
                <div className="md:hidden">
                  <button
                    onClick={() => setShowSubmission(!showSubmission)}
                    className="w-full flex justify-between items-center p-4 bg-white rounded-lg shadow"
                  >
                    <span className="font-semibold">Submission Details</span>
                    {showSubmission ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  {showSubmission && (
                    <div className="mt-2">
                      <SubmissionCard projId={projId} stageId={stageId} taskId={taskId} task={task} taskLocked={taskLocked} />
                    </div>
                  )}
                </div>
                <div className="hidden md:block">
                  <SubmissionCard projId={projId} stageId={stageId} taskId={taskId} task={task} taskLocked={taskLocked} />
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-8">
              {/* Public Comments */}
              <div className="col-span-1 md:col-span-5">
                <div className="flex flex-col w-full bg-white rounded-lg shadow">
                  <div className="flex items-center space-x-2 text-lg md:text-xl font-semibold text-gray-800 p-4">
                    <Users />
                    <p>Public Comments ({sortedPublicComments.length})</p>
                  </div>
                  <Separator className="bg-gray-400" />
                  <div className="p-4 space-y-4">
                    {sortedPublicComments.map((comment) => (
                      <CommentView key={comment.id} comment={comment} />
                    ))}
                    <CommentBox isPublic={true} projId={projId} stageId={stageId} taskId={taskId} />
                  </div>
                </div>
              </div>

              {/* Private Comments - Collapsible on Mobile */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex flex-col w-full bg-white rounded-lg shadow">
                  <button
                    onClick={() => setShowPrivateComments(!showPrivateComments)}
                    className="md:hidden flex items-center justify-between w-full p-4 text-lg font-semibold text-gray-800"
                  >
                    <div className="flex items-center space-x-2">
                      <UserRoundPen />
                      <p>Private Comments ({sortedPrivateComments.length})</p>
                    </div>
                    {showPrivateComments ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  <div className="hidden md:flex items-center space-x-2 text-xl font-semibold text-gray-800 p-4">
                    <UserRoundPen />
                    <p>Private Comments ({sortedPrivateComments.length})</p>
                  </div>
                  <Separator className="bg-gray-400" />
                  <div className={`p-4 space-y-4 ${!showPrivateComments && 'hidden md:block'}`}>
                    {sortedPrivateComments.map((comment) => (
                      <CommentView key={comment.id} comment={comment} />
                    ))}
                    <CommentBox isPublic={false} projId={projId} stageId={stageId} taskId={taskId} className="shadow-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
      }
    </div >
  );
}

export default TaskPage;