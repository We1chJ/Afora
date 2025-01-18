'use client'
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { File, X, Upload, Check, Loader, Undo } from 'lucide-react';
import { Task } from '@/types/types';
import { setTaskComplete } from '@/actions/actions';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/firebase';

interface FileItem {
    id: string;
    file: File;
}
interface DownloadableFile {
    id: string;
    name: string;
    url: string;
}

const SubmissionCard = ({ task, projId, stageId, taskId, taskLocked }: { task: Task, projId: string, stageId: string, taskId: string, taskLocked: boolean }) => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isSubmittingPending, startSubmittingTransition] = useTransition();
    const [submittedFiles, setSubmittedFiles] = useState<DownloadableFile[]>([]);
    const fetchSubmittedFiles = async () => {
        try {
            const listRef = ref(storage, `tasksSubmission/${taskId}`);
            listAll(listRef)
                .then(async (res) => {
                    const files = await Promise.all(res.items.map(async (itemRef) => {
                        const url = await getDownloadURL(itemRef);
                        return {
                            id: itemRef.name,
                            name: itemRef.name,
                            url
                        };
                    }));
                    setSubmittedFiles(files);
                })
                .catch((error) => {
                    console.error("Failed to list files:", error);
                });
        } catch (error) {
            console.error("Failed to fetch submitted files:", error);
        }
    };

    useEffect(() => {
        fetchSubmittedFiles();
    }, [taskId]);

    useEffect(() => {
        if (task && task.isCompleted !== undefined) {
            setIsCompleted(task.isCompleted);
        }
    }, [task]);

    useEffect(() => {
        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault();
            setIsDragging(true);
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            if (!e.relatedTarget) {
                setIsDragging(false);
            }
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
        };
    }, []);

    const handleFiles = (newFiles: FileList) => {
        const newFileItems = Array.from(newFiles).map(file => ({
            id: crypto.randomUUID(),
            file
        }));
        setFiles(prev => [...prev, ...newFileItems]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(file => file.id !== id));
        const fileUploadInput = document.getElementById('fileUpload') as HTMLInputElement;
        if (fileUploadInput) {
            fileUploadInput.value = '';
        }
    };

    const handleSubmit = () => {
        startSubmittingTransition(async () => {
            try {
                await Promise.all(files.map(async ({ file }) => {
                    const storageRef = ref(storage, `tasksSubmission/${taskId}/${file.name}`);
                    await uploadBytes(storageRef, file, {
                        contentDisposition: `attachment; filename="${file.name}"`
                    });
                }));
                toast.success("Files uploaded successfully!");
                setFiles([]);
                fetchSubmittedFiles();
            } catch (error) {
                toast.error("Failed to upload files.");
                console.error("Upload error:", error);
            }
        });
    }

    const handleToggleCompleteTask = () => {
        startTransition(() => {
            if (taskLocked) {
                toast("This task is locked, try to help others first.");
                return;
            }
            setTaskComplete(projId, stageId, taskId, !isCompleted).then(() => {
            }).catch(() => {
                console.log("set task complete failed");
            });
        });
    };

    return (
        <>
            <Card className="w-full h-fit bg-white p-2 md:p-4 space-y-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardTitle className="flex justify-between items-center">
                    <span className="hidden md:inline">Your submission</span>
                    <span className="md:hidden">
                        <File className="h-5 w-5" />
                    </span>
                    <span className={`text-sm md:text-lg font-semibold ${isCompleted ? 'text-green-500' : 'text-blue-500'}`}>
                        {isCompleted ? (
                            <div className="flex items-center space-x-1">
                                <Check className="h-4 w-4 md:h-5 md:w-5" />
                                <span className="hidden md:inline">Completed</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-1">
                                <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-blue-500"></div>
                                <span className="hidden md:inline">Assigned</span>
                            </div>
                        )}
                    </span>
                </CardTitle>
                <CardContent className="h-full space-y-2 p-0 md:p-2">
                    <div className="space-y-2 overflow-y-auto max-h-28">
                        {submittedFiles.map(({ id, name, url }) => (
                            <div key={id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                <div className="flex items-center space-x-2 md:space-x-3">
                                    <File className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                                    <div className="text-left">
                                        <a href={url} download={name} className="text-xs md:text-sm font-medium text-blue-500 hover:underline">
                                            {name.length > 12 ? `${name.slice(0, 12)}...` : name}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-28">
                        {files.map(({ id, file }) => (
                            <div key={id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                <div className="flex items-center space-x-2 md:space-x-3">
                                    <File className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                                    <div className="text-left">
                                        <p className="text-xs md:text-sm font-medium">
                                            {file.name.length > 12 ? `${file.name.slice(0, 12)}...` : file.name}
                                        </p>
                                        <p className="hidden md:block text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(id)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <X className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {!isCompleted && (
                        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 items-center">
                            <div className="w-full max-w-sm">
                                <Input
                                    id="fileUpload"
                                    type="file"
                                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                    multiple
                                    className="text-xs md:text-sm"
                                />
                            </div>
                            <Button className="w-full md:w-auto" onClick={handleSubmit} disabled={isSubmittingPending || taskLocked}>
                                {isSubmittingPending ? (
                                    <Loader className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                                ) : (
                                    <>
                                        <span className="hidden md:inline">Submit</span>
                                        <Upload className="h-4 w-4 md:hidden" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    <Button
                        className={`w-full ${isCompleted ? 'bg-white text-black border border-black hover:bg-black hover:text-white' : 'bg-black text-white hover:bg-white hover:text-black border border-black'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleToggleCompleteTask}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <span className="hidden md:inline">
                                    {isCompleted ? 'Unsubmitting...' : 'Submitting...'}
                                </span>
                                <Loader className="h-4 w-4 md:h-5 md:w-5 md:ml-2 animate-spin" />
                            </>
                        ) : isCompleted ? (
                            <>
                                <span className="hidden md:inline">Unsubmit</span>
                                <Undo className="h-4 w-4 md:h-5 md:w-5 md:ml-2" />
                            </>
                        ) : (
                            <>
                                <span className="hidden md:inline">Mark as Complete</span>
                                <Check className="h-4 w-4 md:h-5 md:w-5 md:ml-2" />
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {isDragging && (
                <div
                    className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onDragLeave={() => setIsDragging(false)}
                >
                    <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg flex flex-col items-center space-y-4">
                        <Upload className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
                        <p className="text-sm md:text-base text-gray-500">Drop your files here</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default SubmissionCard;