"use client";
import { matching } from "@/ai_scripts/matching";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Organization, projQuestions } from "@/types/types";
import { db } from "@/firebase";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useState, useTransition } from "react";

const GenerateTeamsButton = ({
    orgId,
    setOutput,
}: {
    orgId: string;
    setOutput: (output: string) => void;
}) => {
    const [open, setOpen] = useState(false);
    const [teamSize, setTeamSize] = useState("");
    const [org, loading, error] = useDocument(doc(db, "organizations", orgId));
    const [isPending, startTransition] = useTransition();
    if (loading) {
        return;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    if (!org) {
        return <div>No organization found</div>;
    }
    const handleGenerateTeams = async () => {
        const orgData = org!.data()! as Organization;

        if (!orgData) {
            return <div>No organization found</div>;
        }

        const memberList = orgData.members;
        const userDataPromise = memberList.map(async (user) => {
            const userOrg = await getDoc(doc(db, "users", user, "org", orgId));
            const userOrgData = userOrg.data();
            const surveyResponse = userOrgData?.projOnboardingSurveyResponse
                ? userOrgData.projOnboardingSurveyResponse.join(",")
                : "";
            return `{${user}:${surveyResponse}}`;
        });

        const userData = await Promise.all(userDataPromise);

        startTransition(async () =>
            matching(teamSize, projQuestions, userData)
                .then((output: string) => {
                    console.log("API Response:", output); // Log the output from the matching function
                    setOutput(output);
                    setOpen(false);
                })
                .catch((error: Error) => {
                    console.error("Error:", error); // Handle any errors
                    toast.error(error.message);
                }),
        );
    };
    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>Generate Teams</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Teams</DialogTitle>
                        <DialogDescription>
                            Enter the team size to generate teams.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="teamSize" className="text-right">
                                Team Size
                            </Label>
                            <Input
                                id="teamSize"
                                type="number" // Ensure only numbers are accepted
                                value={teamSize}
                                onChange={(e) => setTeamSize(e.target.value)} // Update state on change
                                placeholder="Enter team size"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isPending}
                            onClick={handleGenerateTeams}
                        >
                            {isPending ? "Generating..." : "Generate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default GenerateTeamsButton;
