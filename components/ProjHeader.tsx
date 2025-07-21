import { Button } from "@/components/ui/button";
import { PencilLine, Save, Trophy } from "lucide-react";
import Link from "next/link";

interface ProjHeaderProps {
    id: string;
    projId: string;
    projTitle: string;
    isEditing: boolean;
    stages: any[];
    setProjTitle: (title: string) => void;
    setIsEditing: (editing: boolean) => void;
    handleEditSave: () => void;
}

export function ProjHeader({
    id,
    projId,
    projTitle,
    isEditing,
    stages,
    setProjTitle,
    setIsEditing,
    handleEditSave,
}: ProjHeaderProps) {
    return (
        <div className="relative">
            <div
                className="bg-gradient-to-r from-[#6F61EF] to-purple-600 h-64 flex items-center justify-center bg-cover bg-center"
                style={{
                    backgroundImage: `linear-gradient(135deg, #6F61EF 0%, #8B7ED8 50%, #B794F6 100%)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                <div
                    className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-6 m-6 w-full max-w-8xl"
                    style={{
                        background: "rgba(255,255,255,0.15)",
                        WebkitBackdropFilter: "blur(10px)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                    }}
                >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between mb-3">
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={projTitle}
                                            onChange={(e) =>
                                                setProjTitle(e.target.value)
                                            }
                                            className="bg-transparent border-b-2 border-white text-white placeholder-gray-200 focus:outline-none focus:border-gray-200"
                                            style={{
                                                width: `${Math.max(projTitle.length, 10)}ch`,
                                            }}
                                        />
                                    ) : (
                                        projTitle
                                    )}
                                </h1>
                                <div className="flex items-center gap-3">
                                    <Link
                                        href={`/org/${id}/proj/${projId}/leaderboard`}
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-white hover:bg-white/20 transition-colors"
                                        >
                                            <Trophy className="h-4 w-4 mr-1" />
                                            Leaderboard
                                        </Button>
                                    </Link>
                                    <Button
                                        variant={
                                            isEditing
                                                ? "secondary"
                                                : "ghost"
                                        }
                                        size="sm"
                                        className={
                                            isEditing
                                                ? "bg-white text-[#6F61EF] hover:bg-gray-100"
                                                : "text-white hover:bg-white/20 transition-colors"
                                        }
                                        onClick={() => {
                                            if (isEditing) {
                                                handleEditSave();
                                            }
                                            setIsEditing(!isEditing);
                                        }}
                                    >
                                        {isEditing ? "Save" : "Edit"}
                                        {isEditing ? (
                                            <Save className="ml-1 h-4 w-4" />
                                        ) : (
                                            <PencilLine className="ml-1 h-4 w-4" />
                                        )}
                                    </Button>
                                    {isEditing && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-white hover:bg-white/20 transition-colors"
                                            onClick={() => {
                                                setIsEditing(false);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl md:text-2xl font-semibold text-white">
                                    Project Overview
                                </h2>
                                {stages && stages.length > 0 && (
                                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-4 py-3 inline-flex items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-white text-sm font-medium">
                                                Progress:
                                            </span>
                                            <div className="bg-white bg-opacity-30 rounded-full h-2 w-48 overflow-hidden">
                                                <div
                                                    className="h-full bg-white rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${(stages.reduce((acc, stage) => acc + stage.tasksCompleted, 0) / stages.reduce((acc, stage) => acc + stage.totalTasks, 0)) * 100}%`,
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
    );
} 