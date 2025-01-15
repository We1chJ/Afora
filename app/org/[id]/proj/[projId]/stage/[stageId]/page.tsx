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
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import { db } from "@/firebase";
import { Stage, Task } from "@/types/types";
import { collection, doc } from "firebase/firestore";
import PieChartProgress from "@/components/PieChartProgress";
import { CircleCheckBig, Clock7, Trash, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTask, deleteTask } from "@/actions/actions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner";

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
  const tasks: Task[] = useMemo(() => {
    return tasksData?.docs.map(doc => ({
      ...(doc.data() as Task)
    })).sort((a, b) => a.order - b.order) || [];
  }, [tasksData]);

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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

  if (!stage) {
    return <div>Error: The stage has been deleted.</div>;
  }

  const tasksCompleted = tasks.filter(task => task.isCompleted).length;

  const handleNewTask = () => {
    createTask(projId, stageId, tasks.length + 1)
      .then(() => {
        toast.success("Task created successfully!");
      })
      .catch((error) => {
        toast.error("Failed to create task: " + error.message);
      });
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTask(projId, stageId, taskId)
      .then(() => {
        toast.success("Task deleted successfully!");
      })
      .catch((error) => {
        toast.error("Failed to delete task: " + error.message);
      })
      .finally(() => {
        setIsOpen(false);
        setIsEditing(false);
      });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Table className="w-full">
        <TableHeader>
          <div className="flex w-full h-full gap-4 p-4 justify-between">
            <div className="w-3/4">
              <Card className="w-full h-full bg-[#6F61EF] hover:shadow-lg transition-shadow">
                <CardHeader className="p-3 flex justify-between">
                  <CardTitle className="text-xl w-full font-bold text-white flex justify-between items-center">
                    {'Stage ' + (stage.order + 1) + '. ' + stage.title}
                    <Button variant="ghost" className="text-white" onClick={() => setIsEditing(!isEditing)}>
                      <Edit3 />
                    </Button>
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
              <PieChartProgress tasksCompleted={tasksCompleted} totalTasks={tasks.length} />
            </div>
          </div>
        </TableHeader>
        <TableBody className="w-full">
          {tasks.map((task, index) => (
            <TableRow className="flex flex-1" key={index}>
              <Link
                className="flex flex-1"
                href={`/org/${id}/proj/${projId}/stage/${stageId}/task/${task.id}`}
                onClick={(e) => isEditing && e.preventDefault()}
              >
                <TableCell className="flex flex-1">
                  <Card className="w-full shadow-lg hover:shadow-3xl hover:translate-y-[-4px] transition-transform duration-300 h-auto">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <span className="text-lg">{index + 1}. {task.title}</span>
                        <div className="flex items-center gap-2">
                          {task.isCompleted ? (
                            <CircleCheckBig className="text-green-500" />
                          ) : (
                            <Clock7 className="text-yellow-500" />
                          )}
                          {isEditing && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="text-red-500"
                                >
                                  <Trash />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this task? This action cannot be undone!
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <Button variant="secondary" onClick={() => setIsOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => { handleDeleteTask(task.id) }}
                                  >
                                    Delete
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </TableCell>
              </Link>
            </TableRow>
          ))}
          {isEditing && (
            <TableRow>
              <TableCell>
                <div className="w-full flex-1 p-4 bg-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      className="w-full flex justify-between items-center"
                      onClick={handleNewTask}
                    >
                      <span className="w-full text-lg font-semibold text-gray-500">
                        + New Task
                      </span>
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
export default StagePage;