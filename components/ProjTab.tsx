'use client'
import { db } from '@/firebase';
import { Project } from '@/types/types';
import { collection, DocumentData, FirestoreError, getDocs, query, QuerySnapshot, where } from 'firebase/firestore';
import React, { useEffect, useState, useTransition } from 'react'
import { useCollection } from 'react-firebase-hooks/firestore';
import GenerateTeamsButton from './GenerateTeamsButton';
import { Button } from './ui/button';
import { updateProjects } from '@/actions/actions';
import { toast } from 'sonner';
import ProjectCard from './ProjectCard';
import { Skeleton } from './ui/skeleton';

type MatchingOutput = {
    groupSize: number
    groups: string[][]
}

const ProjTab = ({ orgId, projectsData, loading, error, userRole, userId }: { userId: string, userRole: string, orgId: string, projectsData: QuerySnapshot<DocumentData, DocumentData> | undefined, loading: boolean, error: FirestoreError | undefined }) => {
    const [isPending, startTransition] = useTransition();

    const [output, setOutput] = useState('');
    const [parsedOutput, setParsedOutput] = useState<MatchingOutput | null>(null);

    const adminQ = query(collection(db, 'projects'), where('orgId', '==', orgId));
    const [allProjects, apLoading, apError] = useCollection(adminQ);

    const userQ = query(collection(db, 'users', userId, 'projs'), where('orgId', '==', orgId))
    const [userProjects, userLoading, userError] = useCollection(userQ);
    const [userProjList, setUserProjList] = useState<Project[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!userLoading && !userError && userProjects && userProjects.docs.length > 0) {
                const projectIds = userProjects.docs.map(doc => doc.id);
                const projectDocs = await getDocs(query(collection(db, 'projects'), where('__name__', 'in', projectIds)));
                const projects = projectDocs.docs.map(doc => doc.data() as Project);
                setUserProjList(projects);
            }
        };
        fetchProjects();
    }, [userProjects, userLoading, userError]);

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
            startTransition(() => {
                updateProjects(orgId, parsedOutput.groups)
                    .then(() => {
                        // Show success toast
                        toast.success('Groups updated successfully');
                    })
                    .catch((error) => {
                        console.error('Failed to update groups:', error);
                        toast.error('Failed to update groups');
                    });
            });
            setOutput('');
        }
    };

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
                        {apLoading && <Skeleton className="h-48 w-full" />}
                        {apError && <p>Error loading projects: {apError.message}</p>}
                        {!apLoading && !apError && allProjects && allProjects.docs.length > 0 && (
                            allProjects.docs
                                .sort((a, b) => {
                                    const projA = a.data() as Project;
                                    const projB = b.data() as Project;
                                    return projA.title.localeCompare(projB.title);
                                })
                                .map((doc) => {
                                    const proj = doc.data() as Project;
                                    return (
                                        <ProjectCard key={proj.projId} orgId={orgId} projId={proj.projId} projectName={proj.title} backgroundImage={''} tasks={[]} />
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
                    {!userLoading && !userError && userProjList.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
                            <p className="text-lg font-bold">No projects found yet. Wait for the admins to create groups.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userLoading && (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <Skeleton className="h-48 w-full" />
                            </div>
                        )}
                        {userError && <p>Error loading projects: {userError.message}</p>}
                        {!userLoading && !userError && userProjList.length > 0 && (
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