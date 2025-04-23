'use client';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { db } from "@/firebase";
import { Organization, Project, Stage, Task } from "@/types/types";
import { doc } from "firebase/firestore";

import { usePathname } from "next/navigation";
import { Fragment, useEffect } from "react";
import { useDocument } from "react-firebase-hooks/firestore";

function Breadcrumbs() {
    // Adds a path that a user can refer to know where they are and click to "parent" directories
    const path = usePathname();

    const segments = path.split("/").filter(segment => segment !== "");
    useEffect(() => {
        if (segments.length >= 1 && segments[0] !== 'org') {
            segments.length = 0;
        }
        console.log(segments);
    }, [path]);
    const orgDocRef = (segments.length >= 1 && segments[0] == 'org')? doc(db, 'organizations', segments[1]) : null;
    const [orgDoc] = useDocument(orgDocRef);
    const orgTitle = orgDoc && orgDoc.exists() ? (orgDoc.data() as Organization).title : null;

    const projDocRef = segments.length >= 3 ? doc(db, 'projects', segments[3]) : null;
    const [projDoc] = useDocument(projDocRef);
    const projTitle = projDoc && projDoc.exists() ? (projDoc.data() as Project).title : null;

    const stageDocRef = segments.length >= 5 ? doc(db, 'projects', segments[3], 'stages', segments[5]) : null;
    const [stageDoc] = useDocument(stageDocRef);
    const stageTitle = stageDoc && stageDoc.exists() ? (stageDoc.data() as Stage).title : null;

    const taskDocRef = segments.length >= 7 ? doc(db, 'projects', segments[3], 'stages', segments[5], 'tasks', segments[7]) : null;
    const [taskDoc] = useDocument(taskDocRef);
    const taskTitle = taskDoc && taskDoc.exists() ? (taskDoc.data() as Task).title : null;

    const titles = [orgTitle, projTitle, stageTitle, taskTitle];

    return (
        <Breadcrumb>
            <BreadcrumbList className="text-white">
                <BreadcrumbItem>
                    <BreadcrumbLink href="/" className="text-white">Home</BreadcrumbLink>
                </BreadcrumbItem>
                {segments.map((segment, index) => {
                    if (!segment) return null;
                    if (index % 2 == 1 || index + 1 >= segments.length) return null; // skip the even ones and make sure there is an ID afterwards
                    const href = `${segments.slice(0, index + 2).join("/")}`
                    const isLast = index === segments.length - 2;
                    const title = titles[index / 2];
                    return (
                        <Fragment key={segment}>
                            {title !== null && <BreadcrumbSeparator className="text-white" />}
                            <BreadcrumbItem key={segment}>
                                {isLast ? (
                                    <BreadcrumbPage className="text-white">{title && title.length > 10 ? `${title.slice(0, 10)}...` : title}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={`/${href}`} className="text-white">{title && title.length > 10 ? `${title.slice(0, 10)}...` : title}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
export default Breadcrumbs
