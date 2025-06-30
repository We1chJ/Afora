'use server'

import { auth } from "@clerk/nextjs/server";
import { db } from "@/firebase-admin";
import { revalidatePath } from "next/cache";

// Task Pool Actions for backend integration

export async function assignTaskToUser(taskId: string, projId: string, stageId: string, userId: string) {
    try {
        const { userId: currentUserId } = await auth();
        
        if (!currentUserId) {
            throw new Error('User not authenticated');
        }

        // Get task reference
        const taskRef = db.collection('projects').doc(projId).collection('stages').doc(stageId).collection('tasks').doc(taskId);
        const taskDoc = await taskRef.get();
        
        if (!taskDoc.exists) {
            throw new Error('Task not found');
        }

        const taskData = taskDoc.data();
        
        // Check if task is available or overdue
        if (taskData?.status !== 'available' && taskData?.status !== 'overdue') {
            // If assigned to someone else, check if it's overdue
            if (taskData?.status === 'assigned') {
                const softDeadline = new Date(taskData.soft_deadline);
                const now = new Date();
                
                if (now <= softDeadline) {
                    throw new Error('Task is currently assigned and not overdue');
                }
            } else {
                throw new Error('Task is not available for assignment');
            }
        }

        // Update task
        await taskRef.update({
            assignee: userId,
            status: 'assigned',
            assignedAt: new Date().toISOString(),
            canBeReassigned: false
        });

        // Update user stats (if tracking stats in a separate collection)
        const userStatsRef = db.collection('projects').doc(projId).collection('userStats').doc(userId);
        const userStatsDoc = await userStatsRef.get();
        
        if (userStatsDoc.exists) {
            await userStatsRef.update({
                tasksAssigned: (userStatsDoc.data()?.tasksAssigned || 0) + 1
            });
        } else {
            await userStatsRef.set({
                userId,
                email: userId, // Assuming userId is email for now
                totalPoints: 0,
                tasksCompleted: 0,
                tasksAssigned: 1,
                averageCompletionTime: 0,
                streak: 0
            });
        }

        revalidatePath(`/org/*/proj/${projId}/stage/${stageId}`);
        return { success: true };
        
    } catch (error) {
        console.error('Error assigning task:', error);
        return { success: false, message: (error as Error).message };
    }
}

export async function unassignTask(taskId: string, projId: string, stageId: string) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Get task reference
        const taskRef = db.collection('projects').doc(projId).collection('stages').doc(stageId).collection('tasks').doc(taskId);
        const taskDoc = await taskRef.get();
        
        if (!taskDoc.exists) {
            throw new Error('Task not found');
        }

        const taskData = taskDoc.data();
        
        // Check if user is assigned to this task
        if (taskData?.assignee !== userId) {
            throw new Error('You are not assigned to this task');
        }

        // Update task
        await taskRef.update({
            assignee: '',
            status: 'available',
            assignedAt: null,
            canBeReassigned: false
        });

        // Update user stats
        const userStatsRef = db.collection('projects').doc(projId).collection('userStats').doc(userId);
        const userStatsDoc = await userStatsRef.get();
        
        if (userStatsDoc.exists) {
            await userStatsRef.update({
                tasksAssigned: Math.max(0, (userStatsDoc.data()?.tasksAssigned || 1) - 1)
            });
        }

        revalidatePath(`/org/*/proj/${projId}/stage/${stageId}`);
        return { success: true };
        
    } catch (error) {
        console.error('Error unassigning task:', error);
        return { success: false, message: (error as Error).message };
    }
}

export async function completeTask(taskId: string, projId: string, stageId: string) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Get task reference
        const taskRef = db.collection('projects').doc(projId).collection('stages').doc(stageId).collection('tasks').doc(taskId);
        const taskDoc = await taskRef.get();
        
        if (!taskDoc.exists) {
            throw new Error('Task not found');
        }

        const taskData = taskDoc.data();
        
        // Check if user is assigned to this task
        if (taskData?.assignee !== userId) {
            throw new Error('You are not assigned to this task');
        }

        // Check if task is already completed
        if (taskData?.isCompleted) {
            throw new Error('Task is already completed');
        }

        const completedAt = new Date().toISOString();
        const assignedAt = new Date(taskData.assignedAt);
        const completionTime = (new Date(completedAt).getTime() - assignedAt.getTime()) / (1000 * 60 * 60); // hours

        // Update task
        await taskRef.update({
            isCompleted: true,
            status: 'completed',
            completedAt: completedAt
        });

        // Update stage progress
        const stageRef = db.collection('projects').doc(projId).collection('stages').doc(stageId);
        const stageDoc = await stageRef.get();
        
        if (stageDoc.exists) {
            const stageData = stageDoc.data();
            await stageRef.update({
                tasksCompleted: (stageData?.tasksCompleted || 0) + 1
            });
        }

        // Update user stats
        const userStatsRef = db.collection('projects').doc(projId).collection('userStats').doc(userId);
        const userStatsDoc = await userStatsRef.get();
        
        if (userStatsDoc.exists) {
            const userData = userStatsDoc.data();
            const newTasksCompleted = (userData?.tasksCompleted || 0) + 1;
            const currentAvgTime = userData?.averageCompletionTime || 0;
            const newAvgTime = ((currentAvgTime * (newTasksCompleted - 1)) + completionTime) / newTasksCompleted;
            
            await userStatsRef.update({
                totalPoints: (userData?.totalPoints || 0) + (taskData?.points || 1),
                tasksCompleted: newTasksCompleted,
                averageCompletionTime: newAvgTime,
                // Simple streak calculation - can be improved
                streak: (userData?.streak || 0) + 1
            });
        } else {
            await userStatsRef.set({
                userId,
                email: userId,
                totalPoints: taskData?.points || 1,
                tasksCompleted: 1,
                tasksAssigned: 1,
                averageCompletionTime: completionTime,
                streak: 1
            });
        }

        revalidatePath(`/org/*/proj/${projId}/stage/${stageId}`);
        revalidatePath(`/org/*/proj/${projId}/leaderboard`);
        return { success: true, pointsEarned: taskData?.points || 1 };
        
    } catch (error) {
        console.error('Error completing task:', error);
        return { success: false, message: (error as Error).message };
    }
}

export async function getProjectLeaderboard(projId: string) {
    try {
        const { userId } = await auth();
        
        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Get all user stats for this project
        const userStatsSnapshot = await db.collection('projects').doc(projId).collection('userStats').get();
        
        const userScores = userStatsSnapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));

        // Sort by total points (descending)
        userScores.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

        return { success: true, userScores };
        
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateTaskDeadlineStatus() {
    try {
        // This function should be called periodically (e.g., via a cron job)
        // to update overdue tasks
        
        const now = new Date();
        
        // Get all assigned tasks across all projects
        // This is a simplified version - in practice, you'd want to batch this operation
        const projectsSnapshot = await db.collection('projects').get();
        
        for (const projectDoc of projectsSnapshot.docs) {
            const stagesSnapshot = await projectDoc.ref.collection('stages').get();
            
            for (const stageDoc of stagesSnapshot.docs) {
                const tasksSnapshot = await stageDoc.ref.collection('tasks')
                    .where('status', '==', 'assigned')
                    .get();
                
                const batch = db.batch();
                
                for (const taskDoc of tasksSnapshot.docs) {
                    const taskData = taskDoc.data();
                    const softDeadline = new Date(taskData.soft_deadline);
                    
                    if (now > softDeadline) {
                        batch.update(taskDoc.ref, {
                            status: 'overdue',
                            canBeReassigned: true
                        });
                    }
                }
                
                await batch.commit();
            }
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('Error updating task deadline status:', error);
        return { success: false, message: (error as Error).message };
    }
} 