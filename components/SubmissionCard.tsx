import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { File, X, Upload, Check, Loader, Undo } from 'lucide-react';
import { Task } from '@/types/types';
import { setTaskComplete } from '@/actions/actions';
import { useTransition } from 'react';
interface FileItem {
    id: string;
    file: File;
}

const SubmissionCard = ({ task, projId, stageId, taskId }: { task: Task, projId: string, stageId: string, taskId: string }) => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isPending, startTransition] = useTransition();

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

    const handleToggleCompleteTask = () => {
        startTransition(() => {
            setTaskComplete(projId, stageId, taskId, !isCompleted).then(() => {

            }).catch(() => {
                console.log("set task complete failed");
            });
        });
    };
    return (
        <>
            <Card className="w-full h-fit bg-white p-4 space-y-2 shadow-lg hover:shadow-xl transition-shadow">
                <CardTitle className="flex justify-between items-center">
                    <span>Your submission</span>
                    <span className={`text-sm font-semibold ${isCompleted ? 'text-green-500' : 'text-blue-500'}`}>
                        {isCompleted ? 'Completed' : 'Assigned'}
                    </span>
                </CardTitle>
                <CardContent className="h-full space-y-2 ">
                    <div className="space-y-2 overflow-y-auto max-h-28">
                        {files.map(({ id, file }) => (
                            <div key={id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <File className="h-6 w-6 text-gray-400" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">
                                            {file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFile(id)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex space-x-2 items-center">
                        <div className="w-full max-w-sm">
                            <Input
                                id="fileUpload"
                                type="file"
                                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                multiple
                            />
                        </div>
                        <Button>Submit</Button>
                    </div>

                    <Button
                        className={`w-full ${isCompleted ? 'bg-white text-black border border-black hover:bg-black hover:text-white' : 'bg-black text-white hover:bg-white hover:text-black border border-black'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleToggleCompleteTask}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                {isCompleted ? 'Unsubmitting...' : 'Submitting...'}
                                <Loader className="h-5 w-5 ml-2 animate-spin" />
                            </>
                        ) : isCompleted ? (
                            <>
                                Unsubmit
                                <Undo className="h-5 w-5 ml-2" />
                            </>
                        ) : (
                            <>
                                Mark as Complete
                                <Check className="h-5 w-5 ml-2" />
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card >

            {isDragging && (
                <div
                    className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onDragLeave={() => setIsDragging(false)}
                >
                    <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center space-y-4">
                        <Upload className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-500">Drop your files here</p>
                    </div>
                </div>
            )
            }
        </>
    );
};

export default SubmissionCard;