"use client";

import { Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { collection } from "firebase/firestore";
import { db } from "@/firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import { useUser } from "@clerk/nextjs";
import HomePageCard from "./HomePageCard";
import LoadingSpinner from "./LoadingSpinner";
import { UserOrgData } from "@/types/types";
import Background3D from "./Background3D";
import NewOrgButton from "./NewOrgButton";
import JoinOrgButton from "./JoinOrgButton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

function SignedInLanding() {
    const [orgs, setOrgs] = useState<UserOrgData[]>([]);
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress || "";
    const [orgsData, orgsLoading, orgsError] = useCollection(
        email ? collection(db, "users", email, "orgs") : null,
    );

    const [isNewOrgOpen, setIsNewOrgOpen] = useState(false);
    const [isJoinOrgOpen, setIsJoinOrgOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        if (!orgsData) return;
        const orgsList = orgsData.docs.map((doc) => {
            const data = doc.data();
            if (!data.orgId) {
                data.orgId = doc.id;
            }
            return data;
        }) as UserOrgData[];
        setOrgs(orgsList);
    }, [orgsData]);

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 6) return "Good night";
        if (hour < 12) return "Good morning";
        if (hour < 14) return "Good afternoon";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    if (!user || orgsLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Background3D />
                <LoadingSpinner />
            </div>
        );
    }

    if (orgsError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Background3D />
                <div className="text-red-500 bg-red-50 px-6 py-4 rounded-lg shadow-sm">
                    Failed to load organizations. Please try again later.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen max-w-7xl mx-auto">
            <Background3D />
            
            {/* Welcome Section */}
            <div className="relative pt-24 pb-12 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-start">
                        <h2 className="text-xl text-gray-600 mb-2">
                            {getGreeting()},
                        </h2>
                        <h1 className="text-4xl font-bold text-gray-900 mb-1">
                            {user.firstName || user.username}
                        </h1>
                        <p className="text-gray-600">
                            {orgs.length > 0 
                                ? `You've joined ${orgs.length} organization${orgs.length > 1 ? 's' : ''}` 
                                : "Start by creating or joining an organization"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900">My Organizations</h2>
                    
                    {/* Organization Actions */}
                    <div className="relative">
                        <NewOrgButton isOpen={isNewOrgOpen} setIsOpen={setIsNewOrgOpen} />
                        <JoinOrgButton isOpen={isJoinOrgOpen} setIsOpen={setIsJoinOrgOpen} />
                        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-full shadow-md hover:shadow-lg transition-all duration-300 border border-indigo-100 hover:border-indigo-200">
                                    <Plus className="w-5 h-5" />
                                    <span>New Organization</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>
                                    <Button
                                        className="bg-[#6F61EF] w-full hover:bg-[#5646e4]"
                                        onClick={() => {
                                            setIsNewOrgOpen(true);
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        Create Org
                                    </Button>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Button
                                        className="bg-[#6F61EF] w-full hover:bg-[#5646e4]"
                                        onClick={() => {
                                            setIsJoinOrgOpen(true);
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        Join Org
                                    </Button>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {orgs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {orgs
                            .filter((org) => org && org.orgId)
                            .map((org, index) => (
                                <div key={org.orgId}>
                                    <HomePageCard org={org} />
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100">
                        <img
                            src="/logoFull.svg"
                            className="w-24 h-24 mb-6 opacity-80"
                            alt="Logo"
                        />
                        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                            Create Your First Organization
                        </h2>
                        <p className="text-gray-600 mb-8 text-center max-w-md">
                            Create an organization, invite team members, and start your collaboration journey
                        </p>
                        <button 
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-indigo-700"
                            onClick={() => setIsNewOrgOpen(true)}
                        >
                            <Plus className="w-5 h-5" />
                            <span>New Organization</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SignedInLanding;
