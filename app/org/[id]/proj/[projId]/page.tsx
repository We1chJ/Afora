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
import { CircleCheck, EditIcon, Loader2, LockKeyhole, NotepadText, PencilLine, Save, Trash2, Trophy } from "lucide-react";
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
import { useDispatch } from "react-redux";
import { updateStatus } from "@/lib/store/features/stageStatus/stageStatusSlice";

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
  const [isMockMode, setIsMockMode] = useState(false);

  // Mock data
  const [mockProject, setMockProject] = useState<Project | null>(null);
  const [mockStages, setMockStages] = useState<Stage[]>([]);

  useEffect(() => {
    // Redirect to login if the user is not authenticated
    if (isLoaded && !isSignedIn) {
      router.replace('/'); // Redirect to the login page
    }
  }, [isLoaded, isSignedIn, router]);

  // Check if this is mock mode
  useEffect(() => {
    if (id === 'mock-org-123') {
      setIsMockMode(true);
      
      // Create mock project data based on projId
      const mockProjects = [
        {
          projId: 'proj-1',
          orgId: 'mock-org-123',
          title: 'Frontend Development Project',
          members: ['alice@test.com', 'bob@test.com'],
          teamCharterResponse: [
            'Develop a modern, responsive web application using React and TypeScript',
            'Alice (Frontend), Bob (Backend), Product Manager (External)',
            'Create an intuitive user interface with optimal user experience'
          ]
        },
        {
          projId: 'proj-2',
          orgId: 'mock-org-123',
          title: 'Backend Architecture Project',
          members: ['charlie@test.com', 'david@test.com'],
          teamCharterResponse: [
            'Design and implement scalable backend architecture',
            'Charlie (Project Manager), David (QA Engineer)',
            'Build robust, secure, and performant backend services'
          ]
        }
      ];

      const project = mockProjects.find(p => p.projId === projId);
      if (project) {
        setMockProject(project);
        
        // Create mock stages
        const stages: Stage[] = [
          {
            id: 'stage-1',
            title: 'Requirements Analysis & Design',
            order: 0,
            tasksCompleted: 2,
            totalTasks: 3
          },
          {
            id: 'stage-2', 
            title: 'Development Implementation',
            order: 1,
            tasksCompleted: 1,
            totalTasks: 4
          },
          {
            id: 'stage-3',
            title: 'Testing & Deployment',
            order: 2,
            tasksCompleted: 0,
            totalTasks: 2
          }
        ];
        setMockStages(stages);
      }
    }
  }, [id, projId]);

  const [projData, projLoading, projError] = useDocument(isMockMode ? null : doc(db, 'projects', projId));
  const proj = isMockMode ? mockProject : (projData?.data() as Project);
  const [projTitle, setProjTitle] = useState(proj?.title || '');
  
  useEffect(() => {
    if (!isEditing) {
      setProjTitle(proj?.title || '');
    }
  }, [proj]);
  
  const [stagesData, stagesLoading, stagesError] = useCollection(isMockMode ? null : collection(db, 'projects', projId, 'stages'));
  const [teamCharterData, loading, error] = useDocument(isMockMode ? null : doc(db, 'projects', projId));
  
  const stages: Stage[] = useMemo(() => {
    if (isMockMode) {
      return mockStages;
    }
    return stagesData?.docs
      .map(doc => ({
        ...(doc.data() as Stage)
      }))
      .sort((a, b) => a.order - b.order) || [];
  }, [stagesData, isMockMode, mockStages]);

  // Update reorderedStages when stages change
  useEffect(() => {
    if (!isEditing) {
      setReorderedStages(stages.map(stage => ({ ...stage })));
    }
  }, [stages]);

  // 0 = locked, 1 = in progress, 2 = completed
  const [stageStatus, setStageStatus] = useState<number[]>([]);
  const dispatch = useDispatch();
  useEffect(() => {
    const newStageStatus = new Array(stages.length).fill(0);
    stages.forEach((stage, i) => {
      newStageStatus[i] = (i > 0 && newStageStatus[i - 1] !== 2) ? 0 : (stage.tasksCompleted == stage.totalTasks) ? 2 : 1;
    });
    dispatch(updateStatus(newStageStatus.map((status) => status === 0)));
    setStageStatus(newStageStatus);
  }, [stages]);

  if (isMockMode) {
    if (!mockProject) {
      return <Skeleton className="w-full h-96" />;
    }
  } else {
    if (stagesLoading || projLoading) {
      return <Skeleton className="w-full h-96" />;
    }
    if (stagesError) {
      return <div>Error: {stagesError.message}</div>;
    }
    if (projError) {
      return <div>Error: {projError.message}</div>;
    }
  }

  const handleOpenEditing = () => {
    if (isMockMode) {
      setResponses(mockProject?.teamCharterResponse || []);
      return;
    }
    if (!teamCharterData || loading || error) return;
    // fetch the latest team charter data
    const res = (teamCharterData.data()?.teamCharterResponse as string[]) || [];
    setResponses(res);
  };

  const handleTeamCharterSave = () => startTransition(async () => {
    try {
      if (isMockMode) {
        // In mock mode, just update local state
        if (mockProject) {
          setMockProject({
            ...mockProject,
            teamCharterResponse: responses
          });
        }
                 toast.success('Mock team charter saved successfully!');
      } else {
        if (!teamCharterData || loading || error) return;
        await setTeamCharter(projId, responses);
        toast.success('Team Charter saved successfully!');
      }
    } catch (e) {
      console.log(e);
      toast.error('Failed to save Team Charter.');
    }
    setIsOpen(false);
  });

  const handleEditSave = () => {
    try {
      if (isMockMode) {
        // In mock mode, just update local state
        setMockStages([...reorderedStages]);
        if (mockProject && projTitle !== mockProject.title) {
          setMockProject({
            ...mockProject,
            title: projTitle
          });
        }
        toast.success('Mock project roadmap updated successfully!');
        setIsEditing(false);
        return;
      }

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

      if (proj && projTitle !== proj.title) {
        updateProjectTitle(projId, projTitle);
      }
      toast.success('Roadmap & Stages updated successfully!');
    } catch (error) {
      console.error('Error updating Roadmap & Stages:', error);
      toast.error('Failed to update Roadmap & Stages');
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-100">
      {/* Header Section - 类似组织页面的背景图片风格 */}
      <div className="relative">
        <div 
          className="bg-gradient-to-r from-[#6F61EF] to-purple-600 h-64 flex items-center justify-center bg-cover bg-center"
          style={{ 
            backgroundImage: `linear-gradient(135deg, #6F61EF 0%, #8B7ED8 50%, #B794F6 100%)`,
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          }}
        >
          {/* 半透明卡片 - 类似组织页面的设计 */}
          <div 
            className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 m-6 w-full max-w-8xl"
            style={{ 
              background: 'rgba(255,255,255,0.15)', 
              WebkitBackdropFilter: 'blur(10px)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* 项目信息部分 */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {isEditing ? (
                      <input
                        type="text"
                        value={projTitle}
                        onChange={(e) => setProjTitle(e.target.value)}
                        className="bg-transparent border-b-2 border-white text-white placeholder-gray-200 focus:outline-none focus:border-gray-200"
                        style={{ width: `${Math.max(projTitle.length, 10)}ch` }}
                      />
                    ) : (
                      projTitle
                    )}
                  </h1>
                  <div className="flex items-center gap-3">
                    <Link href={`/org/${id}/proj/${projId}/leaderboard`}>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 transition-colors">
                        <Trophy className="h-4 w-4 mr-1" />
                        Leaderboard
                      </Button>
                    </Link>
                    <Button
                      variant={isEditing ? "secondary" : "ghost"}
                      size="sm"
                      className={isEditing ? "bg-white text-[#6F61EF] hover:bg-gray-100" : "text-white hover:bg-white/20 transition-colors"}
                      onClick={() => {
                        if (isEditing) {
                          handleEditSave();
                        }
                        setIsEditing(!isEditing);
                      }}
                    >
                      {isEditing ? 'Save' : 'Edit'}
                      {isEditing ? <Save className="ml-1 h-4 w-4" /> : <PencilLine className="ml-1 h-4 w-4" />}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20 transition-colors"
                        onClick={() => {
                          setIsEditing(false);
                          setReorderedStages(stages.map(stage => ({ ...stage })));
                        }}
                      >
                        Cancel
                      </Button>
                    )}
      </div>
                  
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl md:text-2xl font-semibold text-white">
                    Project Roadmap
                  </h2>
                  {stages && stages.length > 0 && (
                      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-3 inline-flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-white text-sm font-medium">Progress:</span>
                          <div className="bg-white bg-opacity-30 rounded-full h-2 w-48 overflow-hidden">
                            <div 
                              className="h-full bg-white rounded-full transition-all duration-500"
                              style={{ 
                                width: `${(stages.reduce((acc, stage) => acc + stage.tasksCompleted, 0) / stages.reduce((acc, stage) => acc + stage.totalTasks, 0)) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="font-bold text-white text-lg min-w-[3rem]">
                            {Math.round((stages.reduce((acc, stage) => acc + stage.tasksCompleted, 0) / stages.reduce((acc, stage) => acc + stage.totalTasks, 0)) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                </div>          
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-6">
        {stages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center space-y-6">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">No stages yet</h3>
              <p>Try generating stages and tasks to start your project.</p>
            </div>
            <div className="flex justify-center gap-4">
              {!isMockMode ? (
                <GenerateTasksButton
                  orgId={id}
                  projId={projId}
                  teamCharterResponses={isMockMode ? mockProject?.teamCharterResponse || [] : teamCharterData?.data()?.teamCharterResponse || []}
                />
              ) : (
                <Button disabled>
                  Mock Mode: Task generation disabled
                </Button>
              )}
              <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogTrigger asChild>
                  <Button onClick={handleOpenEditing} variant="outline">
                    <EditIcon className="mr-2 h-4 w-4" /> Team Charter
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
                    <Button onClick={() => setIsOpen(false)} variant="outline">Cancel</Button>
                    <Button onClick={handleTeamCharterSave} disabled={isPending}>
                      {isPending ? <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Loading</> : 'Save'}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
                 ) : (
           <div className="space-y-6">
             {isEditing ? (
               <div className="bg-white rounded-lg shadow-sm border p-6">
                 <h3 className="text-lg font-semibold mb-4 text-gray-800">Edit Stages</h3>
                 <Reorder.Group
                   axis="y"
                   values={reorderedStages}
                   onReorder={setReorderedStages}
                   className="w-full space-y-3"
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
                           className={`w-full block flex-1 p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-all duration-300 cursor-grab`}
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
                                    <p className="text-sm">This stage is locked. Help your team members finish their tasks first!</p>
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
                <div className="w-full flex items-center mt-4 gap-4">
                  <ReorderIcon dragControls={dragControl} />
                  <div className="w-full block flex-1 p-4 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors duration-300 cursor-pointer">
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
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Project Stages</h3>
                <div className="space-y-3">
                  {stages.map((stage, index) => (
                    <Link
                      key={stage.id}
                      href={`/org/${id}/proj/${projId}/stage/${stage.id}`}
                      className="block p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
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
                              <p className="text-sm">This stage is locked. Help your team members finish their tasks first!</p>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectPage;
