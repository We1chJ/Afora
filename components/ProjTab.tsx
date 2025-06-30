'use client'
import { db } from '@/firebase';
import { Project } from '@/types/types';
import { collection, DocumentData, FirestoreError, getDocs, query, QuerySnapshot, where } from 'firebase/firestore';
import React, { useEffect, useState, useTransition } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore';
import GenerateTeamsButton from './GenerateTeamsButton';
import { Button } from './ui/button';
import { updateProjects } from '@/actions/actions';
import { mockUpdateProjects } from '@/actions/mockActions';
import { toast } from 'sonner';
import ProjectCard from './ProjectCard';
import { Skeleton } from './ui/skeleton';

type MatchingOutput = {
    groupSize: number
    groups: string[][]
}

const ProjTab = ({ orgId, projectsData, loading, error, userRole, userId, isMockMode = false }: { userId: string, userRole: string, orgId: string, projectsData: QuerySnapshot<DocumentData, DocumentData> | undefined, loading: boolean, error: FirestoreError | undefined, isMockMode?: boolean }) => {
    const [isPending, startTransition] = useTransition();

    const [output, setOutput] = useState('');
    const [parsedOutput, setParsedOutput] = useState<MatchingOutput | null>(null);

    // Only use Firebase queries when not in mock mode
    const adminQ = !isMockMode ? query(collection(db, 'projects'), where('orgId', '==', orgId)) : null;
    const [allProjects, apLoading, apError] = useCollection(adminQ);

    const userQ = !isMockMode ? query(collection(db, 'users', userId, 'projs'), where('orgId', '==', orgId)) : null;
    const [userProjects, userLoading, userError] = useCollection(userQ);
    const [userProjList, setUserProjList] = useState<Project[]>([]);

    // Mock project data for editor users
    const mockUserProjects: Project[] = [
        {
            projId: 'proj-1',
            orgId: 'mock-org-123',
            title: 'Frontend Development Project',
            members: ['alice@test.com', 'bob@test.com'],
            teamCharterResponse: []
        },
        {
            projId: 'proj-2',
            orgId: 'mock-org-123',
            title: 'Backend Architecture Project',
            members: ['charlie@test.com', 'david@test.com'],
            teamCharterResponse: []
        }
    ];

    useEffect(() => {
        if (isMockMode) {
            // In mock mode, simulate user projects based on user email
            const userEmail = userId || 'admin@test.com';
            const filteredProjects = mockUserProjects.filter(proj => 
                proj.members.includes(userEmail) || userRole === 'admin'
            );
            setUserProjList(filteredProjects);
        } else {
            const fetchProjects = async () => {
                if (!userLoading && !userError && userProjects && userProjects.docs.length > 0) {
                    const projectIds = userProjects.docs.map(doc => doc.id);
                    const projectDocs = await getDocs(query(collection(db, 'projects'), where('__name__', 'in', projectIds)));
                    const projects = projectDocs.docs.map(doc => doc.data() as Project);
                    setUserProjList(projects);
                }
            };
            fetchProjects();
        }
    }, [userProjects, userLoading, userError, isMockMode, userId, userRole]);

    useEffect(() => {
        if (output) {
            try {
                const parsed: MatchingOutput = JSON.parse(output);
                setParsedOutput(parsed);
            } catch (error) {
                console.error('Failed to parse output:', error);
            }
        }
    }, [output]);

    const handleAccept = () => {
        if (parsedOutput) {
            startTransition(async () => {
                try {
                    if (isMockMode) {
                        const result = await mockUpdateProjects(orgId, parsedOutput.groups);
                        if (result.success) {
                            toast.success('Mock team groups updated successfully!');
                        } else {
                            toast.error('Failed to update groups: ' + result.message);
                        }
                    } else {
                        await updateProjects(orgId, parsedOutput.groups);
                        toast.success('Groups updated successfully');
                    }
                } catch (error) {
                    console.error('Failed to update groups:', error);
                    toast.error('Failed to update groups');
                }
            });
            setOutput('');
        }
    };

    // Use mock data when in mock mode
    const displayProjects = isMockMode ? 
        { docs: projectsData?.docs || [] } : 
        (userRole === 'admin' ? allProjects : null);
    
    const displayLoading = isMockMode ? false : (userRole === 'admin' ? apLoading : userLoading);
    const displayError = isMockMode ? null : (userRole === 'admin' ? apError : userError);

    return (
        <>
            {userRole === 'admin' &&
                <div>
                    {output && parsedOutput && parsedOutput.groups && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {parsedOutput.groups.map((group, index) => (
                                    <div key={index} className="group-card shadow-md p-2 mb-2 rounded-lg bg-white dark:bg-gray-800">
                                        <h3 className="text-md font-semibold mb-1 text-gray-900 dark:text-gray-100">Group {index + 1}</h3>
                                        <ul>
                                            {group.map((member, memberIndex) => (
                                                <li key={memberIndex} className="text-gray-700 dark:text-gray-300 text-xs">{member}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end space-x-4 mt-4">
                                <Button disabled={isPending} onClick={handleAccept}>
                                    {isPending ? 'Accepting...' : 'Accept'}
                                </Button>
                                <Button variant="secondary" onClick={() => setOutput('')}>
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayLoading && <Skeleton className="h-48 w-full" />}
                        {displayError && <p>Error loading projects: {displayError.message}</p>}
                        {!displayLoading && !displayError && displayProjects && displayProjects.docs.length > 0 && (
                            displayProjects.docs
                                .sort((a, b) => {
                                    const projA = isMockMode ? a.data() : a.data() as Project;
                                    const projB = isMockMode ? b.data() : b.data() as Project;
                                    return projA.title.localeCompare(projB.title);
                                })
                                .map((doc) => {
                                    const proj = isMockMode ? doc.data() : doc.data() as Project;
                                    return (
                                        <ProjectCard key={proj.projId || (proj as any).id} orgId={orgId} projId={proj.projId || (proj as any).id} projectName={proj.title} backgroundImage={''} tasks={[]} />
                                    );
                                })
                        )}
                    </div>
                    {!output && !loading && !error && projectsData && projectsData.docs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
                            <p className="text-lg font-bold">No projects found.</p>
                            <GenerateTeamsButton setOutput={setOutput} orgId={orgId} />
                        </div>
                    )}

                </div >
            }
            {userRole === 'editor' &&
                <div>
                    {!isMockMode && !userLoading && !userError && userProjList.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
                            <p className="text-lg font-bold">No projects found yet. Wait for the admins to create groups.</p>
                        </div>
                    )}
                                         {isMockMode && userProjList.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
                            <p className="text-lg font-bold">🧪 Mock Mode: No projects assigned to you</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {!isMockMode && userLoading && (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <Skeleton className="h-48 w-full" />
                            </div>
                        )}
                        {!isMockMode && userError && <p>Error loading projects: {userError.message}</p>}
                        {userProjList.length > 0 && (
                            userProjList
                                .sort((a, b) => a.title.localeCompare(b.title))
                                .map((proj) => (
                                    <ProjectCard key={proj.projId} orgId={orgId} projId={proj.projId} projectName={proj.title} backgroundImage={''} tasks={[]} />
                                ))
                        )}
                    </div>
                </div>
            }
        </>
    )
}

export default ProjTab