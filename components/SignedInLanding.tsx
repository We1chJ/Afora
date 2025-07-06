'use client';

import { ArrowUpCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { collection } from 'firebase/firestore';
import { db } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useUser } from '@clerk/nextjs';
import HomePageCard from './HomePageCard';
import LoadingSpinner from './LoadingSpinner';

import { UserOrgData } from '@/types/types';

function SignedInLanding() {
    const [orgs, setOrgs] = useState<UserOrgData[]>([]);
    const { user } = useUser();

    const userId = user?.id || "nonemptyString";
    const [orgsData, orgsLoading, orgsError] = useCollection(collection(db, "users", userId, "orgs"));

    useEffect(() => {
        if (!orgsData) return;
        const orgsList = orgsData.docs.map((doc) => (doc.data())) as UserOrgData[];
        setOrgs(orgsList);
    }, [orgsData]);

    if (!user || orgsLoading) {
        return <div className='flex justify-center items-center'><LoadingSpinner /></div>;
    }

    if (orgsError) {
        return <div>Error loading organizations</div>;
    }

    console.log("Organizations:", orgs);
    return (
        <div className='flex p-4 w-full h-full'>
            {orgs.length > 0 ? (
                <div className="flex flex-wrap gap-8 m-4 h-full">
                    {orgs.map((org) => (
                        <HomePageCard org={org} key={org.orgId} />
                    ))}
                </div>
            )
                : (
                    <div className="flex justify-center items-center w-full p-4 h-full">
                        <div className="flex animate-pulse flex-row">
                            <h1 className="px-2 font-bold text-2xl text-gray-800">Get Started With Creating a New Organization</h1>
                            <ArrowUpCircle className="w-12 h-12 text-[#6F61EF]" />
                        </div>
                    </div>
                )}
        </div>
    );
}

export default SignedInLanding;
