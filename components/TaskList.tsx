'use client'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import React, { useEffect } from 'react'
import Link from "next/link"
import { Skeleton } from "./ui/skeleton"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useCollection, useDocument } from "react-firebase-hooks/firestore"
import { db } from "@/firebase"
import { Stage, Task } from "@/types/types"
import { collection, doc } from "firebase/firestore"
import PieChartProgress from "./PieChartProgress"

const TaskList = ({ orgId, projId, stageId }: { orgId: string, projId: string, stageId: string }) => {
  const { isSignedIn, isLoaded } = useAuth(); // Get authentication state
  const router = useRouter();
  useEffect(() => {
    // Redirect to login if the user is not authenticated
    if (isLoaded && !isSignedIn) {
      router.replace('/'); // Redirect to the login page
    }
  }, []);

  const [stageData, stageLoading, stageError] = useDocument(doc(db, 'projects', projId, 'stages', stageId));
  const [tasksData, tasksLoading, tasksError] = useCollection(collection(db, 'projects', projId, 'stages', stageId, 'tasks'));

  if (stageLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  if (stageError) {
    return <div>Error: {stageError.message}</div>;
  }

  const stage = stageData?.data() as Stage;
  if (tasksLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  if (tasksError) {
    return <div>Error: {tasksError.message}</div>;
  }

  const tasks: Task[] = tasksData?.docs.map(doc => ({
    ...(doc.data() as Task)
  })) || [];

  if (!stage) {
    return <div>Error: The stage has been deleted.</div>;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <Table className="w-full">
        <TableHeader>
          <div className="flex w-full h-full gap-4 p-4 justify-between">
            <div className="w-3/4">
              <Card className="w-full h-full bg-[#6F61EF] hover:shadow-lg transition-shadow">
                <CardHeader className="p-3">
                  <CardTitle className="text-xl font-bold text-white">
                    {'Stage ' + stage.order + '. ' + stage.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <h1 className="text-4xl font-bold text-white">
                    Tasks
                  </h1>
                </CardContent>
              </Card>
            </div>
            <div className="w-1/4">
              <PieChartProgress
                // progress={33}
                // title="Progress"
              />
            </div>
          </div>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="font-medium text-black">No Tasks</TableCell>
            </TableRow>
          ) : (
            tasks
              // .sort((a, b) => a.order - b.order)
              .map((task, index) => (

                <TableRow className="flex flex-1" key={index}>
                  <Link className="flex flex-1" href={`/org/${orgId}/proj/${projId}/stage/${stageId}/task/${task.id}`}>
                    {/* <TableCell className="font-medium text-black whitespace-nowrap">{stage.order} - {stage.title}</TableCell> */}
                    <TableCell className="flex flex-1">
                      <Card className="w-full shadow-lg hover:shadow-3xl hover:translate-y-[-4px] transition-transform duration-300 h-auto">
                        <CardHeader className="p-0">
                          <div className="text-lg p-4">
                            {index + 1}. {task.title}
                          </div>
                        </CardHeader>
                      </Card>
                    </TableCell>
                  </Link>
                </TableRow>
              ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default TaskList