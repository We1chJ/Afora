'use server'
import { adminDb } from "@/firebase-admin";
import { GeneratedTasks, Stage } from "@/types/types";
import { auth } from "@clerk/nextjs/server";
import { Timestamp } from "firebase/firestore";
import axios from 'axios';

// IMPLEMENT THIS WITH FIREBASE FIRESTORE NOW THAT WE AREN'T USING LIVE BLOCKS

export async function createNewUser(userEmail: string, username: string, userImage: string) {
    auth().protect();

    try {
        const userRef = adminDb.collection('users').doc(userEmail);

        // update current user's profile info whenever it is changed/updated
        await userRef.set({
            email: userEmail,
            username: username,
            userImage: userImage
        }, { merge: true });
    }
    catch (e) {
        return { success: false, message: (e as Error).message };
    }
}

export async function createNewOrganization(orgName: string, orgDescription: string) {
    auth().protect();

    try {
        const { sessionClaims } = await auth();
        const userId = sessionClaims!.email!;
        if (!userId) {
            throw new Error('Current user not authenticated or invalid email');
        }

        // Validate orgDescription for valid characters
        const validRegex = /^[a-zA-Z0-9.,'-]+$/;
        if (!validRegex.test(orgName)) {
            throw new Error('Organization name contains invalid characters. Only alphanumeric characters and punctuation (.,\'-) are allowed.');
            // I feel like  an organization should be able to contain spaces because that is so normal
            // Would there be a way to do this? 
        }


        const docCollectionRef = adminDb.collection("organizations");
        const docRef = await docCollectionRef.add({
            createdAt: new Date(),
            title: orgName,
            description: orgDescription,
            admins: [userId],
            members: []
        })

        await adminDb.collection('users').doc(userId).collection
            ('orgs').doc(docRef.id).set({
                userId: userId,
                role: "admin",
                orgId: docRef.id
            })
        return { orgId: docRef.id, success: true };
    } catch (e) {
        return { success: false, message: (e as Error).message }
    }
}

export async function deleteOrg(orgId: string) {
    auth().protect(); // ensure the user is authenticated

    console.log(orgId);
    try {

        await adminDb.collection("organizations").doc(orgId).delete();

        const query = await adminDb
            .collectionGroup("orgs")
            .where("orgId", "==", orgId)
            .get();

        const batch = adminDb.batch();
        // delete the organization reference in the user's collection for every user in the organization
        query.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false };
    }
}

export async function inviteUserToOrg(orgId: string, email: string, access: string) {
    auth().protect();

    try {
        const userDoc = await adminDb.collection('users').doc(email).get();
        // TODO: consider adding sending emails invitations
        if (!userDoc.exists) {
            throw new Error(`User with email ${email} not found!`);
        }

        orgId = orgId.trim();
        if (!orgId) {
            throw new Error('Organization id cannot be empty');
        }

        const orgSnapshot = await adminDb.collection("organizations").doc(orgId).get();

        // Check if the organization exists
        if (!orgSnapshot.exists) {
            throw new Error(`Organization with id ${orgId} not found`);
        }

        // Check if the user is already a member of the organization
        const organizationData = orgSnapshot.data();
        const members = organizationData?.members || [];
        const admins = organizationData?.admins || [];

        if (members.includes(email) || admins.includes(email)) {
            throw new Error(`User is already a member of the organization`);
        }

        // Add the user to the organization's members or admins array
        await adminDb.collection("organizations").doc(orgId).set(
            (access === 'admin') ? { admins: [...admins, email] } : { members: [...members, email] }, // append the new email to the corresponding array
            { merge: true } // use merge to only update the members or admins field without overwriting the document
        );

        await adminDb
            .collection("users")
            .doc(email)
            .collection("orgs")
            .doc(orgId)
            .set({
                userId: email,
                role: access,
                createdAt: new Date(),
                orgId,
            });

        return { success: true, message: 'User invited successfully' };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function setUserOnboardingSurvey(selectedTags: string[][]) {
    auth().protect();

    const { sessionClaims } = await auth();
    const userId = sessionClaims?.email!;
    try {
        const formatted = selectedTags.map((tags) => tags.join(','));

        // Check if any of the formatted strings are empty
        if (formatted.some(tag => tag === '')) {
            throw new Error('Please select at least one tag for each question!');
        }

        await adminDb.collection('users').doc(userId).set({
            onboardingSurveyResponse: formatted
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function setProjOnboardingSurvey(orgId: string, responses: string[]) {
    auth().protect();

    const { sessionClaims } = await auth();
    const userId = sessionClaims?.email!;
    try {

        // Check if any of the responses are empty
        if (responses.some(r => r === '')) {
            throw new Error('Please answer all questions!');
        }

        await adminDb.collection('users').doc(userId).collection('orgs').doc(orgId).set({
            projOnboardingSurveyResponse: responses
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateProjects(orgId: string, groups: string[][]) {
    auth().protect();
    const { sessionClaims } = await auth();
    const userId = sessionClaims?.email!;
    try {
        groups.map(async (group, index) => {
            const projectRef = await adminDb.collection('projects')
                .add({
                    orgId: orgId,
                    title: `Project ${index + 1}`,
                    members: group,
                    admins: [userId]
                });

            const projectId = projectRef.id;
            await projectRef.update({ projId: projectId });
            await adminDb.collection('organizations').doc(orgId).collection('projs').add({
                projId: projectId,
                members: group
            });
            group.map(async (user) => {
                await adminDb.collection('users').doc(user).collection('projs').doc(projectId).set({
                    orgId: orgId
                }, { merge: true });
            })
        })
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function setTeamCharter(projId: string, teamCharterResponse: string[]) {
    auth().protect();

    const { sessionClaims } = await auth();
    const userId = sessionClaims?.email!;
    try {
        if (!teamCharterResponse) {
            throw new Error('Team charter cannot be empty!');
        }

        await adminDb.collection('projects').doc(projId).set({
            teamCharterResponse: teamCharterResponse
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
};

export async function updateStagesTasks(projId: string, structure: GeneratedTasks): Promise<{ success: boolean; message?: string; }> {
    auth().protect();

    try {
        if (!structure) {
            throw new Error('Invalid stages and tasks structure!');
        }

        const batch = adminDb.batch();
        structure.stages.forEach((stage, stageIndex) => {
            const stageRef = adminDb.collection('projects').doc(projId).collection('stages').doc();
            batch.set(stageRef, {
                title: stage.stage_name,
                id: stageRef.id,
                order: stageIndex,
                totalTasks: stage.tasks.length,
                tasksCompleted: 0
            });

            stage.tasks.forEach((task, taskIndex) => {
                const taskRef = stageRef.collection('tasks').doc();
                batch.set(taskRef, {
                    title: task.task_name,
                    description: task.task_description,
                    assignee: null,
                    id: taskRef.id,
                    order: taskIndex,
                    soft_deadline: task.soft_deadline,
                    hard_deadline: task.hard_deadline
                });
            });
        });
        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function setTaskComplete(projId: string, stageId: string, taskId: string, isCompleted: boolean) {
    auth().protect();
    try {
        const taskRef = adminDb.collection("projects").doc(projId).collection("stages").doc(stageId).collection("tasks").doc(taskId);
        const stageRef = adminDb.collection("projects").doc(projId).collection("stages").doc(stageId);

        const batch = adminDb.batch();
        batch.set(taskRef, { isCompleted: isCompleted }, { merge: true });

        const stageDoc = await stageRef.get();
        const stageData = stageDoc.data() as Stage;
        const tasksCompleted = isCompleted ? stageData.tasksCompleted + 1 : stageData.tasksCompleted - 1;
        batch.set(stageRef, { tasksCompleted }, { merge: true });

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function postComment(isPublic: boolean, projId: string, stageId: string, taskId: string, message: string, time: Timestamp, uid: string) {
    auth().protect();
    try {
        const newCommentRef = adminDb.collection("projects").doc(projId).collection("stages").doc(stageId).collection("tasks").doc(taskId).collection((isPublic) ? 'public' : 'private').doc();
        await newCommentRef.set({
            message: message,
            msgId: newCommentRef.id,
            time: time,
            uid: uid
        });
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateStages(projId: string, stageUpdates: Stage[], stagesToDelete: string[]) {
    auth().protect();

    try {
        const batch = adminDb.batch();
        const projRef = adminDb.collection('projects').doc(projId).collection("stages");

        stageUpdates.forEach((stage: Stage) => {
            // add new stages
            if (stage.id === '-1') {
                const newStageRef = projRef.doc();
                batch.set(newStageRef, {
                    title: stage.title,
                    id: newStageRef.id,
                    order: stage.order,
                    totalTasks: 0,
                    tasksCompleted: 0
                });
            } else {
                batch.set(projRef.doc(stage.id), { order: stage.order, title: stage.title }, { merge: true });
            }
        })

        // delete stages
        stagesToDelete.forEach((stageId: string) => {
            batch.delete(projRef.doc(stageId));
        });

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function createTask(projId: string, stageId: string, order: number) {
    auth().protect();

    try {
        const taskRef = adminDb.collection("projects").doc(projId).collection("stages").doc(stageId).collection("tasks").doc();
        const defaultTask = {
            title: "New Task",
            description: "This is a default task description.",
            assignedTo: "",
            id: taskRef.id,
            order: order,
            isCompleted: false
        };

        await taskRef.set(defaultTask);

        const stageRef = adminDb.collection("projects").doc(projId).collection("stages").doc(stageId);
        const stageDoc = await stageRef.get();
        const stageData = stageDoc.data() as Stage;
        const totalTasks = stageData.totalTasks + 1;

        await stageRef.set({ totalTasks }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function deleteTask(projId: string, stageId: string, taskId: string) {
    auth().protect();

    try {
        const taskRef = adminDb.collection("projects").doc(projId).collection("stages").doc(stageId).collection("tasks").doc(taskId);
        const stageRef = adminDb.collection("projects").doc(projId).collection("stages").doc(stageId);

        const batch = adminDb.batch();
        batch.delete(taskRef);

        const stageDoc = await stageRef.get();
        const stageData = stageDoc.data() as Stage;
        const totalTasks = stageData.totalTasks - 1;
        const tasksCompleted = stageData.tasksCompleted - (stageData.tasksCompleted > 0 ? 1 : 0);

        batch.set(stageRef, { totalTasks, tasksCompleted }, { merge: true });

        await batch.commit();
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateTask(projId: string, stageId: string, taskId: string, title: string, description: string, soft_deadline: string, hard_deadline: string) {
    auth().protect();

    try {
        await adminDb.collection('projects').doc(projId).collection("stages").doc(stageId).collection("tasks").doc(taskId).set(
            ({ title, description, soft_deadline, hard_deadline }), { merge: true }
        );

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateProjectTitle(projId: string, newTitle: string) {
    auth().protect();

    try {
        if (!newTitle) {
            throw new Error('Project title cannot be empty!');
        }

        await adminDb.collection('projects').doc(projId).set({
            title: newTitle
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function getStageLockStatus(projId: string) {
    auth().protect();

    try {
        const stagesSnapshot = await adminDb.collection("projects").doc(projId).collection("stages").orderBy("order").get();
        const stages = stagesSnapshot.docs.map(doc => doc.data() as Stage);

        const locked: boolean[] = stages.map((stage, index) => {
            if (index === 0) return false; // First stage is never locked
            return stages[index - 1].tasksCompleted < stages[index - 1].totalTasks;
        });

        return locked;
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function searchPexelsImages(searchQuery: string) {
    auth().protect();

    try {
        const response = await axios.get("https://api.pexels.com/v1/search", {
            headers: { Authorization: process.env.PEXELS_API_KEY },
            params: { query: searchQuery, per_page: 9 },
        });

        const imageUrls = response.data.photos.map((photo: any) => photo.src.original);
        return { success: true, urls: imageUrls };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function setBgImage(orgId: string, imageUrl: string) {
    auth().protect();

    try {
        if (!imageUrl) {
            throw new Error('Image URL cannot be empty!');
        }

        await adminDb.collection('organizations').doc(orgId).set({
            backgroundImage: imageUrl
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function getOrganizationMembersResponses(orgId: string) {
    auth().protect();

    try {
        // Get organization data
        const orgDoc = await adminDb.collection('organizations').doc(orgId).get();
        if (!orgDoc.exists) {
            throw new Error('Organization not found');
        }

        const orgData = orgDoc.data();
        const members = [...(orgData?.members || []), ...(orgData?.admins || [])];

        if (members.length === 0) {
            return { success: true, data: [] };
        }

        // Get all members' onboardingSurveyResponse
        const memberResponses = await Promise.all(
            members.map(async (memberEmail) => {
                const userDoc = await adminDb.collection('users').doc(memberEmail).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const responses = userData?.onboardingSurveyResponse || [];
                    return {
                        email: memberEmail,
                        responses: responses
                    };
                }
                return null;
            })
        );

        // Filter out null values
        const validResponses = memberResponses.filter(response => response !== null);

        return { success: true, data: validResponses };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}