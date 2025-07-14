"use client";

import OrganizationPage from "@/components/OrganizationPage";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

function OrgPage() {
    const params = useParams();
    const id = params.id as string;
    
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
