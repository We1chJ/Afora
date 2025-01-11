'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/firebase";
import { useAuth, useUser } from "@clerk/nextjs";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDocument } from "react-firebase-hooks/firestore";
import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Card, CardContent } from "@/components/ui/card";
import SubmissionCard from "@/components/SubmissionCard";
import { Separator } from "@/components/ui/separator";
import { UserRoundPen, Users } from "lucide-react";
import CommentBox from "@/components/CommentBox";
import { Task } from "@/types/types";
import CommentView from "@/components/CommentView";

function TaskPage({ params: { id, projId, stageId, taskId } }: {
  params: {
    id: string;
    projId: string;
    stageId: string;
    taskId: string
  }
}) {
  console.log(id);
  const { isSignedIn, isLoaded } = useAuth(); // Get authentication state
  const { user } = useUser();
  const router = useRouter();
  useEffect(() => {
    // Redirect to login if the user is not authenticated
    if (isLoaded && !isSignedIn) {
      router.replace('/'); // Redirect to the login page
    }
    console.log('projId', projId);
    console.log('stageId', stageId);
  }, [isLoaded, isSignedIn, projId, stageId]);

  const [taskData, taskLoading, taskError] = useDocument(doc(db, 'projects', projId, 'stages', stageId, 'tasks', taskId));

  if (!user || taskLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  if (taskError) {
    return <div>Error: {taskError.message}</div>;
  }

  const task = taskData?.data() as Task;

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {isSignedIn &&
        <div className="p-6 flex-1">
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              <ResizablePanelGroup direction="horizontal" className="space-x-8">
                <ResizablePanel defaultSize={70}>
                  <Card className="w-full bg-[#6F61EF] hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 space-y-8">
                      <h1 className="text-4xl font-bold text-white">
                        {task?.title || "Task Title"}
                      </h1>
                      <p className="text-sm text-white mt-2">
                        {task?.description || "No description available"}
                      </p>
                      <div className="text-sm text-white">
                        <strong>Assigned to:</strong> {task?.assignedTo || "No assignee"}
                      </div>
                    </CardContent>
                  </Card>
                </ResizablePanel>
                <ResizablePanel defaultSize={30}>
                  <SubmissionCard projId={projId} stageId={stageId} taskId={taskId} task={task} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizablePanel defaultSize={50}>
              <ResizablePanelGroup direction="horizontal" className="space-x-8">
                <ResizablePanel defaultSize={70} className="h-full space-y-2">
                  <div className="flex items-center space-x-2 text-xl font-semibold text-gray-800">
                    <Users />
                    <p>Public Comment</p>
                  </div>
                  <Separator className="bg-gray-400" />
                  <div className="flex flex-col p-4 w-full h-full space-y-2">
                    {/* display comments */}
                    <CommentView />
                    <CommentBox isPublic={true} projId={projId} stageId={stageId} taskId={taskId} />
                  </div>
                </ResizablePanel>
                <ResizablePanel defaultSize={30}>
                  <Card className="w-full py-2 bg-white hover:shadow-lg transition-shadow">
                    <CardContent className="space-y-2">
                      <h2 className="flex items-center space-x-2 text-xl font-semibold text-gray-800">
                        <UserRoundPen />
                        <p>Private Comment</p>
                      </h2>
                      <Separator className="bg-gray-400" />
                      <CommentBox isPublic={false} projId={projId} stageId={stageId} taskId={taskId} className="shadow-none w-full" />
                    </CardContent>
                  </Card>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>}
    </div>
  )
}
export default TaskPage;