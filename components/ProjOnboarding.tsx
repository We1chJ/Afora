'use client'
import React, { useEffect, useState } from 'react'

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from './ui/button';
import { projHeader, projQuestions } from '@/types/types';
import { Progress } from "@/components/ui/progress"
import { setProjOnboardingSurvey } from '@/actions/actions';
import { toast } from 'sonner';
import { db } from '@/firebase';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { useUser } from '@clerk/nextjs';
import { Textarea } from './ui/textarea';
import TimeSlotSelector from './TimeSlotSelector';
const ProjOnboarding = ({ orgId }: { orgId: string }) => {
    const [responses, setResponses] = useState<string[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
    const [isOpen, setIsOpen] = useState(false);
    const [page, setPage] = useState(0);

    useEffect(() => {
        // Open the dialog automatically when the component mounts
        setIsOpen(true);
        setPage(0);
        setResponses(Array(projQuestions.length).fill(""));
        setSelectedSlots(new Set());
    }, []);

    const handleSubmit = async () => {
        const selectedSlotsString = Array.from(selectedSlots).join(', ');
        responses[projQuestions.length - 1] = selectedSlotsString;
        const { success, message } = await setProjOnboardingSurvey(orgId, responses);
        if (success) {
            toast.success('Survey response received successfully!');
            setIsOpen(false);
        } else {
            toast.error(message);
        }
    }

    const { user } = useUser();

    // 安全地构建文档路径
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    const shouldFetchUserData = Boolean(userEmail && orgId);
    
    // Debug information - remove in production
    // console.log('ProjOnboarding debug:', { userEmail, orgId, shouldFetchUserData });

    const [userData] = useDocument(
        (userEmail && orgId) ? doc(db, 'users', userEmail, 'orgs', orgId) : null
    );

    if (!userData || userData.data()?.projOnboardingSurveyResponse) {
        return null;
    }

    return (
        <>
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                {/* <AlertDialogOverlay className="bg-black bg-opacity-80 fixed inset-0" /> */}
                {/* <AlertDialogTrigger>Open</AlertDialogTrigger> */}
                <AlertDialogContent className="w-full max-w-2xl">
                    <Progress value={page / (projQuestions.length) * 100} />

                    {page === 0 &&
                        <AlertDialogHeader>
                            <AlertDialogTitle>Project Onboarding Survey</AlertDialogTitle>
                            <AlertDialogDescription>
                                Please take a minute to fill out this mandatory form. The information will be used for matching of teammates for your project.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    }

                    {page > 0 &&
                        <>
                            <AlertDialogTitle>{projHeader[page - 1]}</AlertDialogTitle>
                            <p>{`Q${page}: ${projQuestions[page - 1]}`}</p>
                            {page === projQuestions.length ? (
                                <TimeSlotSelector
                                    selectedSlots={selectedSlots}
                                    setSelectedSlots={setSelectedSlots}
                                />
                            ) : (
                                <Textarea
                                    placeholder="Enter your response"
                                    value={responses[page - 1]}
                                    onChange={(e) => {
                                        setResponses((prev) => {
                                            const newR = [...prev];
                                            newR[page - 1] = e.target.value;
                                            return newR;
                                        });
                                    }}
                                />
                            )}
                        </>
                    }

                    <AlertDialogFooter >
                        {/* <AlertDialogCancel onClick={() => setIsOpen(false)}>Cancel</AlertDialogCancel> */}
                        {page === 0 && <Button onClick={() => setPage(page + 1)}>Start</Button>}
                        {page > 0 &&
                            <>
                                <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 1}>Back</Button>
                                {page < projQuestions.length ?
                                    <Button onClick={() => setPage(page + 1)}>Next</Button>
                                    :
                                    <Button onClick={handleSubmit}>Submit</Button>
                                }
                            </>
                        }
                    </AlertDialogFooter >
                </AlertDialogContent >
            </AlertDialog >
        </>
    )
}

export default ProjOnboarding