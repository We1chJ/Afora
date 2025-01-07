'use client';

import { db } from "@/firebase";
import { useAuth } from "@clerk/nextjs";
import { collection, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
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
import { EditIcon, Loader2 } from "lucide-react";
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
import { setTeamCharter } from "@/actions/actions";
import { toast } from "sonner";
import GenerateTasksButton from "@/components/GenerateTasksButton";
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
  useEffect(() => {
    // Redirect to login if the user is not authenticated
    if (isLoaded && !isSignedIn) {
      router.replace('/'); // Redirect to the login page
    }
    console.log('projid', projId);
  }, []);

  const [projData, projLoading, projError] = useDocument(doc(db, 'projects', projId));
  const [stagesData, stagesLoading, stagesError] = useCollection(collection(db, 'projects', projId, 'stages'));
  const [teamCharterData, loading, error] = useDocument(doc(db, 'projects', projId));

  if (stagesLoading || projLoading) {
    return <Skeleton className="w-full h-96" />;
  }
  if (stagesError) {
    return <div>Error: {stagesError.message}</div>;
  }
  if (projError) {
    return <div>Error: {projError.message}</div>;
  }

  const proj = projData?.data() as Project;

  const stages: Stage[] = stagesData?.docs.map(doc => ({
    ...(doc.data() as Stage)
  })) || [];


  const handleOpenEditing = () => {
    if (!teamCharterData || loading || error) return;
    // fetch the latest team charter data
    const res = (teamCharterData.data()?.teamCharterResponse as string[]) || [];
    setResponses(res);
  };

  const handleSaving = () => startTransition(async () => {
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

  return (
    <div className="flex flex-col w-full h-full">

      <Table>
        <TableHeader>
          <div className="rounded-lg overflow-hidden bg-[#6F61EF] p-4 m-4 h-56 ">
            <div className="flex flex-col justify-between h-full p-2">
              <h1 className="text-xl font-bold text-white">
                {proj.title}
              </h1>
              <div className="flex w-full items-center justify-between">
                <h1 className="text-4xl font-bold text-white">
                  Project Stages
                </h1>
                <div className="flex items-center space-x-4 self-end">
                  <Progress
                    value={33}
                    className="w-96"
                  />
                  <span className="font-bold text-white text-2xl">33%</span>
                </div>
              </div>
            </div>
          </div>
        </TableHeader>
        <TableBody>
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
                        <Button onClick={handleSaving} disabled={isPending}>
                          {isPending ? <><Loader2 className="animate-spin mr-2" /> Loading</> : 'Save'}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            </>
          ) : (
            stages
              .sort((a, b) => a.order - b.order)
              .map((stage, index) => (
                <TableRow key={index} className="border-b">
                  <TableCell colSpan={2} className="p-4">
                    <Link href={`/org/${id}/proj/${projId}/stage/${stage.id}`} className="block p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
                      <div className="text-lg font-semibold">
                        {index + 1}. {stage.title}
                      </div>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
          )}
        </TableBody>
      </Table>
    </div >
  )
}
export default ProjectPage
