'use client';

import TaskList from "@/components/TaskList";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function StagePage({ params: { id, projId, stageId } }: {
  params: {
    id: string;
    projId: string;
    stageId: string;
  }
}) {
  console.log(id, projId, stageId);
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

  return (
    <div className="flex flex-col h-screen">
      {isSignedIn && <TaskList orgId={id} projId={projId} stageId={stageId} />}
    </div>
  )
}
export default StagePage;