'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/firebase";
import { useAuth } from "@clerk/nextjs";
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

  if (taskLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  if (taskError) {
    return <div>Error: {taskError.message}</div>;
  }

  const task = taskData?.data();

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
                    </CardContent>
                  </Card>
                </ResizablePanel>
                <ResizablePanel defaultSize={30}>
                  <SubmissionCard />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizablePanel defaultSize={50}>
              <ResizablePanelGroup direction="horizontal" className="space-x-8">
                <ResizablePanel defaultSize={70}>
                  Public Comment
                </ResizablePanel>
                <ResizablePanel defaultSize={30}>
                  Private Comment
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>}
    </div>
  )
}
export default TaskPage;