 'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheckBig, Clock7, Trash, User, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
  isEditing: boolean;
  handleNewTask: () => void;
  handleDeleteTask: (taskId: string) => void;
  isPending: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  orgId: string;
  projId: string;
  stageId: string;
  userRole?: 'admin' | 'user';
  currentUserEmail?: string;
}

const TaskManagement = ({
  tasks,
  isEditing,
  handleNewTask,
  handleDeleteTask,
  isPending,
  isOpen,
  setIsOpen,
  orgId,
  projId,
  stageId,
  userRole = 'admin',
  currentUserEmail = 'admin@test.com'
}: TaskManagementProps) => {
  // 根据用户角色过滤任务
  const filteredTasks = userRole === 'admin' 
    ? tasks 
    : tasks.filter(task => 
        task.assignee === currentUserEmail || 
        task.assignee === '' || 
        task.status === 'available'
      );

  const tasksCompleted = filteredTasks.filter(task => task.isCompleted).length;
  const myTasks = tasks.filter(task => task.assignee === currentUserEmail);
  const myCompletedTasks = myTasks.filter(task => task.isCompleted).length;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg overflow-hidden">
      {/* Main Task List */}
      <div className="w-full bg-white flex flex-col shadow-lg rounded-lg">
        {/* Header */}
        <div className={`p-6 border-b border-gray-200 text-white ${
          userRole === 'admin' 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
            : 'bg-gradient-to-r from-green-600 to-emerald-600'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              {userRole === 'admin' ? (
                <Crown className="h-6 w-6" />
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {userRole === 'admin' ? 'Admin Panel' : 'My Tasks'}
              </h2>
              <p className="text-xs opacity-90">
                {userRole === 'admin' ? 'Task Management' : 'Personal View'}
              </p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            {userRole === 'admin' ? (
              <>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
                  <div className="text-2xl font-bold">{filteredTasks.length}</div>
                  <div className="text-xs opacity-90">Total Tasks</div>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
                  <div className="text-2xl font-bold">{tasksCompleted}</div>
                  <div className="text-xs opacity-90">Completed</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
                  <div className="text-2xl font-bold">{myTasks.length}</div>
                  <div className="text-xs opacity-90">My Tasks</div>
                </div>
                <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
                  <div className="text-2xl font-bold">{myCompletedTasks}</div>
                  <div className="text-xs opacity-90">Completed</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> 
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task, index) => {
                const isMyTask = task.assignee === currentUserEmail;
                const isAvailable = task.assignee === '' || task.status === 'available';
                
                return (
                  <Card
                    key={task.id}
                    className={`transition-all duration-200 hover:shadow-lg ${
                      userRole === 'user' && isMyTask 
                        ? 'border-l-4 border-l-green-500' 
                        : userRole === 'user' && isAvailable 
                        ? 'border-l-4 border-l-orange-500' 
                        : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`mt-1 ${task.isCompleted ? 'text-green-500' : 'text-yellow-500'}`}>
                            {task.isCompleted ? (
                              <CircleCheckBig className="h-5 w-5" />
                            ) : (
                              <Clock7 className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-medium truncate">
                              {index + 1}. {task.title}
                              {userRole === 'user' && isMyTask && (
                                <span className="ml-2 text-xs text-green-600 font-medium">(Mine)</span>
                              )}
                              {userRole === 'user' && isAvailable && (
                                <span className="ml-2 text-xs text-orange-600 font-medium">(Available)</span>
                              )}
                            </CardTitle>
                          </div>
                        </div>
                        
                        {/* 只有admin才能删除任务 */}
                        {isEditing && userRole === 'admin' && (
                          <AlertDialog open={isOpen}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:bg-red-50 ml-2"
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
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="text-sm text-gray-600 line-clamp-3">
                        {task.description}
                      </div>
                      
                      {/* Progress Bar and Percentage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Completion</span>
                          <span className={`text-xs font-bold ${
                            (task.completionPercentage || 0) === 100 
                              ? 'text-green-600' 
                              : (task.completionPercentage || 0) >= 50 
                              ? 'text-blue-600' 
                              : 'text-gray-600'
                          }`}>
                            {task.completionPercentage || 0}%
                          </span>
                        </div>
                        <Progress 
                          value={task.completionPercentage || 0} 
                          className="h-2"
                        />
                      </div>
                      
                      {/* Assignee and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.assignee && (
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {task.assignee.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs text-gray-500 font-semibold">
                            {userRole === 'user' 
                              ? (task.assignee ? 'Assigned' : 'Unassigned')
                              : (task.assignee || 'Unassigned')
                            }
                          </span>
                        </div>
                        
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
                      
                      {/* Deadlines */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Soft: {new Date(task.soft_deadline).toLocaleDateString()}</div>
                        <div>Hard: {new Date(task.hard_deadline).toLocaleDateString()}</div>
                      </div>
                      
                      {/* Action Button */}
                      <Link href={`/org/${orgId}/proj/${projId}/stage/${stageId}/task/${task.id}`}>
                        <Button size="sm" className="w-full mt-3">
                          {userRole === 'user' && isMyTask 
                            ? 'Work on Task'
                            : userRole === 'user' && isAvailable
                            ? 'Claim Task'
                            : 'View Details'
                          }
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <CircleCheckBig className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {userRole === 'admin' ? 'No tasks created yet' : 'No tasks assigned to you'}
                </h3>
                <p className="text-gray-500">
                  {userRole === 'admin' 
                    ? 'Create your first task to get started with project management.'
                    : 'Check back later for new task assignments or contact your project manager.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions - 只有admin才能创建新任务 */}
        {((isEditing && userRole === 'admin') || (filteredTasks.length === 0 && userRole === 'admin')) && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleNewTask}
              disabled={isPending}
            >
              <CircleCheckBig className="h-4 w-4 mr-2" />
              {isPending ? 'Creating...' : 'Create New Task'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagement; 