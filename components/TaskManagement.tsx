'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheckBig, Clock7, Trash } from "lucide-react";
import Link from "next/link";
import { Task } from "@/types/types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TaskManagementProps {
  tasks: Task[];
  selectedTask: string | null;
  setSelectedTask: (taskId: string | null) => void;
  isEditing: boolean;
  handleNewTask: () => void;
  handleDeleteTask: (taskId: string) => void;
  isPending: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  orgId: string;
  projId: string;
  stageId: string;
}

const TaskManagement = ({
  tasks,
  selectedTask,
  setSelectedTask,
  isEditing,
  handleNewTask,
  handleDeleteTask,
  isPending,
  isOpen,
  setIsOpen,
  orgId,
  projId,
  stageId
}: TaskManagementProps) => {
  const tasksCompleted = tasks.filter(task => task.isCompleted).length;

  return (
    <div className="flex h-auto bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg overflow-hidden">
      {/* Left Sidebar - Task List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <CircleCheckBig className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Task Overview</h2>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
              <div className="text-2xl font-bold">{tasks.length}</div>
              <div className="text-xs opacity-90">Total Tasks</div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
              <div className="text-2xl font-bold">{tasksCompleted}</div>
              <div className="text-xs opacity-90">Completed</div>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3"> 
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedTask === task.id
                      ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedTask(task.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${task.isCompleted ? 'text-green-500' : 'text-yellow-500'}`}>
                      {task.isCompleted ? (
                        <CircleCheckBig className="h-5 w-5" />
                      ) : (
                        <Clock7 className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${
                        selectedTask === task.id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {index + 1}. {task.title}
                      </div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {task.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {task.assignee && (
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {task.assignee.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.isCompleted 
                            ? 'bg-green-100 text-green-800' 
                            : task.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {task.isCompleted ? 'Completed' : task.status === 'overdue' ? 'Overdue' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                    {isEditing && (
                      <AlertDialog open={isOpen}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsOpen(true);
                            }}
                          >
                            <Trash className="h-4 w-4" />
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
                              disabled={isPending}
                            >
                              {isPending ? <Clock7 className="animate-spin" /> : "Delete"}
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CircleCheckBig className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No tasks created yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {(isEditing || tasks.length === 0) && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Button 
              className="w-full" 
              size="sm" 
              onClick={handleNewTask}
              disabled={isPending}
            >
              <CircleCheckBig className="h-4 w-4 mr-2" />
              {isPending ? 'Creating...' : 'New Task'}
            </Button>
          </div>
        )}
      </div>

      {/* Right Content Area - Task Details */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Content Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          {selectedTask && tasks.find(t => t.id === selectedTask) ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {tasks.find(t => t.id === selectedTask)?.title}
                </h3>
                <p className="text-sm text-gray-500">
                  Task Details & Information
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tasks.find(t => t.id === selectedTask)?.isCompleted
                    ? 'bg-green-100 text-green-800'
                    : tasks.find(t => t.id === selectedTask)?.status === 'overdue'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {tasks.find(t => t.id === selectedTask)?.isCompleted 
                    ? 'Completed' 
                    : tasks.find(t => t.id === selectedTask)?.status === 'overdue' 
                    ? 'Overdue' 
                    : 'In Progress'}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Select a Task</h3>
              <p className="text-sm text-gray-500">Choose a task from the left to view details</p>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTask && tasks.find(t => t.id === selectedTask) ? (
            <div className="space-y-6">
              {(() => {
                const task = tasks.find(t => t.id === selectedTask)!;
                return (
                  <>
                    {/* Task Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CircleCheckBig className="h-5 w-5 text-blue-600" />
                          Task Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                            <p className="text-gray-900">{task.description}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned to:</h4>
                              {task.assignee ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                                    {task.assignee.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{task.assignee}</p>
                                    <p className="text-sm text-gray-500">Team Member</p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">Unassigned</p>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                task.isCompleted
                                  ? 'bg-green-100 text-green-800'
                                  : task.status === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {task.isCompleted ? 'Completed' : task.status === 'overdue' ? 'Overdue' : 'In Progress'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Deadlines */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock7 className="h-5 w-5 text-orange-600" />
                          Deadlines
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Soft Deadline</h4>
                            <p className="text-lg font-semibold text-gray-900">
                              {new Date(task.soft_deadline).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(task.soft_deadline).toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Hard Deadline</h4>
                            <p className="text-lg font-semibold text-gray-900">
                              {new Date(task.hard_deadline).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(task.hard_deadline).toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-center mt-4">
                      <Link href={`/org/${orgId}/proj/${projId}/stage/${stageId}/task/${task.id}`}>
                        <Button className="w-full">
                          See More Detail
                        </Button>
                      </Link>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-12">
              <CircleCheckBig className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a task to view details</h3>
              <p className="text-gray-500">Choose a task from the list to see detailed information, deadlines, and assignment details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManagement;