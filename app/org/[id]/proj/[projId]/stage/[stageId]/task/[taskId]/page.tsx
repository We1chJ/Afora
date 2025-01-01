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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Taskage({ params: { id, projId, stageId, taskId } }: {
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
    <div className="flex flex-col flex-1 h-screen">
      {isSignedIn &&
        <div className="p-4 flex-1">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel className="h-full" minSize={70} defaultSize={70}>
              <ResizablePanelGroup direction={"vertical"} className="h-full">
                <ResizablePanel className="h-full" defaultSize={70}>
                  <h1 className="text-4xl font-bold">{task?.title}</h1>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Assigned to: {task?.assignedTo}</p>
                    {/* <p className="text-sm text-gray-600">Deadline: {task?.deadline}</p> */}
                    <p className="text-lg mt-4">{task?.description}</p>
                    <Input id="upload" type="file" className="hidden" />
                    <Label htmlFor="upload" className="cursor-pointer inline-block bg-black text-white py-3 px-4 rounded">
                      Upload File
                    </Label>
                  </div>
                </ResizablePanel>
                <ResizablePanel className="h-full" defaultSize={70}>
                  <h2 className="text-2xl font-semibold">Comments</h2>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizablePanel className="h-full">
              <h2 className="text-2xl font-semibold">Admin Feedback</h2>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>}
    </div>
  )
}
export default Taskage;