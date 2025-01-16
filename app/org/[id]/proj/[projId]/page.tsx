'use client';

import { db } from "@/firebase";
import { useAuth } from "@clerk/nextjs";
import { collection, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useCollection, useDocument } from "react-firebase-hooks/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Project, Stage, teamCharterQuestions } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CircleCheck, EditIcon, Loader2, LockKeyhole, NotepadText, PencilLine, Save, Trash2 } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { toast } from "sonner";
import GenerateTasksButton from "@/components/GenerateTasksButton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertDialogTrigger } from "@radix-ui/react-alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@radix-ui/react-label";
import { setTeamCharter, updateProjectTitle, updateStages } from "@/actions/actions";
import { HoverCard, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { HoverCardContent } from "@/components/ui/hover-card";
import { ReorderIcon } from "@/components/ReorderIcon";

export interface StageProgress {
  stageOrder: number;
  totalTasks: number;
  tasksCompleted: number;
  locked: boolean;
}

function ProjectPage({ params: { id, projId } }: {
  params: {
    id: string;
    projId: string;
  }
}) {
  const { isSignedIn, isLoaded } = useAuth(); // Get authentication state
  const [responses, setResponses] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [reorderedStages, setReorderedStages] = useState<Stage[]>([]);
  const dragControl = useDragControls();

  useEffect(() => {
    // Redirect to login if the user is not authenticated
    if (isLoaded && !isSignedIn) {
      router.replace('/'); // Redirect to the login page
    }
  }, [isLoaded, isSignedIn, router]);

  const [projData, projLoading, projError] = useDocument(doc(db, 'projects', projId));
  const proj = projData?.data() as Project;
  const [projTitle, setProjTitle] = useState(proj?.title || '');
  useEffect(() => {
    if (!isEditing) {
      setProjTitle(proj?.title || '');
    }
  }, [proj]);
  const [stagesData, stagesLoading, stagesError] = useCollection(collection(db, 'projects', projId, 'stages'));
  const [teamCharterData, loading, error] = useDocument(doc(db, 'projects', projId));
  const stages: Stage[] = useMemo(() => {
    return stagesData?.docs
      .map(doc => ({
        ...(doc.data() as Stage)
      }))
      .sort((a, b) => a.order - b.order) || [];
  }, [stagesData]);

  // Update reorderedStages when stages change
  useEffect(() => {
    if (!isEditing) {
      setReorderedStages(stages.map(stage => ({ ...stage })));
    }
  }, [stages]);

  // 0 = locked, 1 = in progress, 2 = completed
  const [stageStatus, setStageStatus] = useState<number[]>([]);
  useEffect(() => {
    const newStageStatus = new Array(stages.length).fill(0);
    stages.forEach((stage, i) => {
      newStageStatus[i] = (i > 0 && newStageStatus[i - 1] !== 2) ? 0 : (stage.tasksCompleted == stage.totalTasks) ? 2 : 1;
    });
    setStageStatus(newStageStatus);
  }, [stages]);

  if (stagesLoading || projLoading) {
    return <Skeleton className="w-full h-96" />;
  }
  if (stagesError) {
    return <div>Error: {stagesError.message}</div>;
  }
  if (projError) {
    return <div>Error: {projError.message}</div>;
  }


  const handleOpenEditing = () => {
    if (!teamCharterData || loading || error) return;
    // fetch the latest team charter data
    const res = (teamCharterData.data()?.teamCharterResponse as string[]) || [];
    setResponses(res);
  };

  const handleTeamCharterSave = () => startTransition(async () => {
    if (!teamCharterData || loading || error) return;
    try {
      await setTeamCharter(projId, responses);
      toast.success('Team Charter saved successfully!');
    } catch (e) {
      console.log(e);
      toast.error('Failed to save Team Charter.');
    }
    setIsOpen(false);
  });

  const handleEditSave = () => {
    try {
      const stageUpdates: Stage[] = [];
      reorderedStages.forEach((stage, index) => {
        const originalStage = stages.find(s => s.id === stage.id);
        // id = -1 for adding a new stage
        // push change for new stages
        if (!originalStage) {
          stageUpdates.push({ ...stage, order: index });
        } else if (stage.order !== index || (originalStage && stage.title !== originalStage.title)) { // only commit changes on order change and renaming
          stageUpdates.push({ ...stage, order: index, title: stage.title });
        }
      });
      const stagesToDelete = stages.filter(stage => !reorderedStages.some(reorderedStage => reorderedStage.id === stage.id));
      const stagesToDeleteIds = stagesToDelete.map(stage => stage.id);
      updateStages(projId, stageUpdates, stagesToDeleteIds);

      if (projTitle !== proj.title) {
        updateProjectTitle(projId, projTitle);
      }
      toast.success('Roadmap & Stages updated successfully!');
    } catch (error) {
      console.error('Error updating Roadmap & Stages:', error);
      toast.error('Failed to update Roadmap & Stages');
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <Table className="w-full">
        <TableHeader>
          <div className="rounded-lg overflow-hidden bg-[#6F61EF] p-4 m-4 h-56">
            <div className="flex flex-col justify-between h-full p-2">
              <h1 className="w-full text-xl flex justify-between font-bold text-white">
                {isEditing ? (
                  <input
                    type="text"
                    value={projTitle}
                    onChange={(e) => {
                      setProjTitle(e.target.value);
                    }}
                    className="focus:outline-none bg-transparent border-b border-white text-white w-auto"
                    style={{ width: `${projTitle.length}ch` }}
                  />
                ) : (
                  projTitle
                )}
                <div className="flex space-x-2">
                  <Button
                    variant={isEditing ? "secondary" : "default"}
                    onClick={() => {
                      if (isEditing) {
                        handleEditSave();
                      }
                      setIsEditing(!isEditing);
                    }}
                  >
                    {isEditing ? 'Save' : 'Edit'}
                    {isEditing ? <Save className="ml-1" /> : <PencilLine className="ml-1" />}
                  </Button>
                  {isEditing && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setReorderedStages(stages.map(stage => ({ ...stage })));
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </h1>
              <div className="flex w-full items-center justify-between">
                <h1 className="text-4xl font-bold text-white">
                  Project Roadmap 🗺️
                </h1>
                {stages && stages.length > 0 && (
                  <div className="flex items-center space-x-4 self-end">
                    <Progress
                      value={(stages.reduce((acc, stage) => acc + stage.tasksCompleted, 0) / stages.reduce((acc, stage) => acc + stage.totalTasks, 0)) * 100}
                      className="w-96"
                    />
                    <span className="font-bold text-white text-2xl">
                      {Math.round((stages.reduce((acc, stage) => acc + stage.tasksCompleted, 0) / stages.reduce((acc, stage) => acc + stage.totalTasks, 0)) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TableHeader>
        <TableBody className="w-full pb-2">
          {stages.length === 0 ? (
            <>
              <TableRow>
                <TableCell colSpan={2} className="font-medium text-black">No stages. Try generate the stages and tasks.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="flex space-x-4">
                  <GenerateTasksButton
                    orgId={id}
                    projId={projId}
                    teamCharterResponses={teamCharterData?.data()?.teamCharterResponse || []}
                  />
                  <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                    <AlertDialogTrigger asChild>
                      <Button onClick={handleOpenEditing}>
                        <EditIcon className="mr-2" /> Team Charter
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-full max-w-4xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Project Team Charter</AlertDialogTitle>
                        <AlertDialogDescription>
                          Fill out this charter to kick off your project! 🚀
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="overflow-y-auto max-h-96">
                        <form className="space-y-4 p-2">
                          {teamCharterQuestions.map((question, index) => (
                            <div key={index}>
                              <Label htmlFor={`question-${index}`}>{question}</Label>
                              <Textarea
                                id={`question-${index}`}
                                name={`question-${index}`}
                                value={responses[index] || ''}
                                onChange={(e) => {
                                  const newResponses = [...responses];
                                  newResponses[index] = e.target.value;
                                  setResponses(newResponses);
                                }}
                              />
                            </div>
                          ))}
                        </form>
                      </div>
                      <AlertDialogFooter>
                        <Button onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button onClick={handleTeamCharterSave} disabled={isPending}>
                          {isPending ? <><Loader2 className="animate-spin mr-2" /> Loading</> : 'Save'}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            </>
          ) : (
            isEditing ? (
              <>
                <Reorder.Group
                  axis="y"
                  values={reorderedStages}
                  onReorder={setReorderedStages}
                  className="w-full px-4 space-y-4 py-2"
                >
                  {reorderedStages.filter(stage => stage.id !== '-2').map((stage, index) => (
                    <Reorder.Item
                      key={stage.id}
                      value={stage}
                      className="w-full touch-none"
                    >
                      <div className="w-full flex items-center gap-4">
                        <ReorderIcon dragControls={dragControl} />
                        <div
                          className={`w-full block flex-1 p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 cursor-grab`}
                        >
                          <div className="flex w-full justify-between items-center">
                            <span className="w-full text-lg font-semibold">
                              {isEditing ? (
                                <div className="flex flex-row items-center">
                                  {index + 1}.{" "}
                                  <input
                                    type="text"
                                    value={stage.title}
                                    onChange={(e) => {
                                      const newStages = [...reorderedStages];
                                      newStages[index].title = e.target.value;
                                      setReorderedStages(newStages);
                                    }}
                                    className="w-full focus:outline-none ml-2 underline" />
                                </div>
                              ) : (
                                stage.title
                              )}
                            </span>
                            <span className="flex items-center text-sm text-gray-500">
                              {stageStatus[index] === 0 && (
                                <HoverCard>
                                  <HoverCardTrigger>
                                    <LockKeyhole className="mr-4" />
                                  </HoverCardTrigger>
                                  <HoverCardContent className="p-2 bg-gray-800 text-white rounded-md shadow-lg">
                                    <p className="text-sm">This stage is locked. Help your team members finish their tasks before moving on!</p>
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                              {stageStatus[index] === 1 && (
                                <HoverCard>
                                  <HoverCardTrigger>
                                    <NotepadText className="mr-4 text-yellow-500" />
                                  </HoverCardTrigger>
                                  <HoverCardContent className="p-2 bg-gray-800 text-white rounded-md shadow-lg">
                                    <p className="text-sm">This stage is in progress. Keep going!</p>
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                              {stageStatus[index] === 2 && (
                                <HoverCard>
                                  <HoverCardTrigger>
                                    <CircleCheck className="mr-4 text-green-500" />
                                  </HoverCardTrigger>
                                  <HoverCardContent className="p-2 bg-gray-800 text-white rounded-md shadow-lg">
                                    <p className="text-sm">This stage is completed. Great job!</p>
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                              {`${stage.tasksCompleted} / ${stage.totalTasks} tasks completed`}
                            </span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="text-red-500"
                                >
                                  <Trash2 />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this stage? All information under this will be deleted forever!
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <Button variant="secondary" onClick={() => setIsOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      const newStages = reorderedStages.filter((_, i) => i !== index);
                                      setReorderedStages(newStages);
                                      setIsOpen(false);
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
                <div className="w-full flex items-center px-4 py-2 gap-4">
                  <ReorderIcon dragControls={dragControl} />
                  <div className="w-full block flex-1 p-4 bg-gray-200 rounded-lg shadow hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                    <div className="flex w-full justify-between items-center">
                      <Button
                        variant="ghost"
                        className="w-full flex justify-between items-center"
                        onClick={() => {
                          const newStage: Stage = {
                            id: '-1',
                            title: 'New Stage',
                            order: reorderedStages.length,
                            tasksCompleted: 0,
                            totalTasks: 0,
                          };
                          setReorderedStages([...reorderedStages, newStage]);
                        }}
                      >
                        <span className="w-full text-lg font-semibold text-gray-500">
                          + New Stage
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full px-4 space-y-4" >
                {stages.map((stage, index) => (
                  <Link
                    href={`/org/${id}/proj/${projId}/stage/${stage.id}`}
                    className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="flex w-full justify-between items-center">
                      <span className="text-lg font-semibold">
                        {index + 1}. {stage.title}
                      </span>
                      <span className="flex items-center text-sm text-gray-500">
                        {stageStatus[index] === 0 && (
                          <HoverCard>
                            <HoverCardTrigger>
                              <LockKeyhole className="mr-4" />
                            </HoverCardTrigger>
                            <HoverCardContent className="p-2 bg-gray-800 text-white rounded-md shadow-lg">
                              <p className="text-sm">This stage is locked. Help your team members finish their tasks before moving on!</p>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                        {stageStatus[index] === 1 && (
                          <HoverCard>
                            <HoverCardTrigger>
                              <NotepadText className="mr-4 text-yellow-500" />
                            </HoverCardTrigger>
                            <HoverCardContent className="p-2 bg-gray-800 text-white rounded-md shadow-lg">
                              <p className="text-sm">This stage is in progress. Keep going!</p>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                        {stageStatus[index] === 2 && (
                          <HoverCard>
                            <HoverCardTrigger>
                              <CircleCheck className="mr-4 text-green-500" />
                            </HoverCardTrigger>
                            <HoverCardContent className="p-2 bg-gray-800 text-white rounded-md shadow-lg">
                              <p className="text-sm">This stage is completed. Great job!</p>
                            </HoverCardContent>
                          </HoverCard>
                        )}
                        {`${stage.tasksCompleted} / ${stage.totalTasks} tasks completed`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default ProjectPage;
