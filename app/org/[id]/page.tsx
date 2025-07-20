"use client";

import OrganizationPage from "@/components/OrganizationPage";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import React from "react";
import { useEffect } from "react";

function OrgPage({ params }) {
    const { id } = React.use(params);
    
    const { isSignedIn, isLoaded } = useAuth(); // Get authentication state
    const router = useRouter();
    useEffect(() => {
        // Redirect to login if the user is not authenticated
        if (isLoaded && !isSignedIn) {
            router.replace("/"); // Redirect to the login page
        }
    }, []);

    return (
        <div className="flex flex-col h-full">
            {isSignedIn && <OrganizationPage id={id} />}
        </div>
    );
}
export default OrgPage;
