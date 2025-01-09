'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { db } from "@/firebase";
import { Stage, Task } from "@/types/types";
import { collection, doc } from "firebase/firestore";
import PieChartProgress from "@/components/PieChartProgress";
import { CircleCheckBig, Clock7 } from "lucide-react";

function StagePage({ params: { id, projId, stageId } }: {
  params: {
    id: string;
    projId: string;
    stageId: string;
  }
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  const [stageData, stageLoading, stageError] = useDocument(doc(db, 'projects', projId, 'stages', stageId));
  const [tasksData, tasksLoading, tasksError] = useCollection(collection(db, 'projects', projId, 'stages', stageId, 'tasks'));

  if (!isSignedIn) return null;

  if (stageLoading || tasksLoading) {
    return <Skeleton className="w-full h-96" />;
  }

  if (stageError) {
    return <div>Error: {stageError.message}</div>;
  }

  if (tasksError) {
    return <div>Error: {tasksError.message}</div>;
  }

  const stage = stageData?.data() as Stage;
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
              <PieChartProgress />
            </div>
          </div>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="font-medium text-black">No Tasks</TableCell>
            </TableRow>
          ) : (
            tasks.map((task, index) => (
              <TableRow className="flex flex-1" key={index}>
                <Link className="flex flex-1" href={`/org/${id}/proj/${projId}/stage/${stageId}/task/${task.id}`}>
                  <TableCell className="flex flex-1">
                    <Card className="w-full shadow-lg hover:shadow-3xl hover:translate-y-[-4px] transition-transform duration-300 h-auto">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <span className="text-lg">{index + 1}. {task.title}</span>
                          {task.isCompleted ? (
                            <CircleCheckBig className="text-green-500" />
                          ) : (
                            <Clock7 className="text-yellow-500" />
                          )}
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
  );
}

export default StagePage;