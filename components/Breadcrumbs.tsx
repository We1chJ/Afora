'use client';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb"
import { db } from "@/firebase";
import { Organization, Project, Stage, Task } from "@/types/types";
import { doc } from "firebase/firestore";

import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { useDocument } from "react-firebase-hooks/firestore";

// 文本截断函数
const truncateText = (text: string, maxLength: number = 15) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
};

function Breadcrumbs() {
    // Adds a path that a user can refer to know where they are and click to "parent" directories
    const path = usePathname();
    const [isMockMode, setIsMockMode] = useState(false);

    console.log(`Path: "${path}"`);

    const segments = path ? path.split("/").filter(segment => segment !== "") : [];
    
    useEffect(() => {
        if (segments.length >= 1 && segments[0] !== 'org') {
            segments.length = 0;
        }
        
        // Check if this is mock mode
        if (segments.length >= 2 && segments[1] === 'mock-org-123') {
            setIsMockMode(true);
        }
        
        console.log(segments);
    }, [path, segments]);

    // Determine route structure
    const isOrgRoute = segments.length >= 2 && segments[0] === 'org';
    const isProjRoute = segments.length >= 4 && segments[2] === 'proj';
    const isStageRoute = segments.length >= 6 && segments[4] === 'stage';
    const isTaskRoute = segments.length >= 8 && segments[6] === 'task';
    const isLeaderboardRoute = segments.length >= 5 && segments[4] === 'leaderboard';
    
    // Get document references based on route structure
    const orgDocRef = (isOrgRoute && !isMockMode) ? doc(db, 'organizations', segments[1]) : null;
    const [orgDoc] = useDocument(orgDocRef);
    
    const projDocRef = (isProjRoute && !isMockMode) ? doc(db, 'projects', segments[3]) : null;
    const [projDoc] = useDocument(projDocRef);
    
    const stageDocRef = (isStageRoute && !isMockMode) ? doc(db, 'projects', segments[3], 'stages', segments[5]) : null;
    const [stageDoc] = useDocument(stageDocRef);
    
    const taskDocRef = (isTaskRoute && !isMockMode) ? doc(db, 'projects', segments[3], 'stages', segments[5], 'tasks', segments[7]) : null;
    const [taskDoc] = useDocument(taskDocRef);

    // Get titles - use mock data if in mock mode
    let orgTitle, projTitle, stageTitle, taskTitle, leaderboardTitle;
    
    if (isMockMode) {
        orgTitle = "Test Organization";
        if (isProjRoute) {
            const projId = segments[3];
            if (projId === 'proj-1') {
                projTitle = "Frontend Development Project";
            } else if (projId === 'proj-2') {
                projTitle = "Backend Architecture Project";
            } else {
                projTitle = "Mock Project";
            }
        }
        if (isStageRoute) {
            stageTitle = "Requirements Analysis & Design";
        }
        if (isTaskRoute) {
            taskTitle = "Mock Task";
        }
        if (isLeaderboardRoute) {
            leaderboardTitle = "Leaderboard";
        }
    } else {
        orgTitle = orgDoc && orgDoc.exists() ? (orgDoc.data() as Organization).title : null;
        projTitle = projDoc && projDoc.exists() ? (projDoc.data() as Project).title : null;
        stageTitle = stageDoc && stageDoc.exists() ? (stageDoc.data() as Stage).title : null;
        taskTitle = taskDoc && taskDoc.exists() ? (taskDoc.data() as Task).title : null;
        if (isLeaderboardRoute) {
            leaderboardTitle = "Leaderboard";
        }
    }

    // 定义breadcrumb项目类型
    type BreadcrumbItemType = {
        title: string;
        href: string;
        isActive?: boolean;
        isEllipsis?: boolean;
    };

    // 计算需要显示的breadcrumb项目数量
    const breadcrumbItems: BreadcrumbItemType[] = [];
    
    // Home
    breadcrumbItems.push({ title: "Home", href: "/" });
    
    // Organization
    if (isOrgRoute && orgTitle) {
        breadcrumbItems.push({ 
            title: truncateText(orgTitle, 12), 
            href: `/${segments.slice(0, 2).join("/")}`,
            isActive: !isProjRoute
        });
    }
    
    // Project  
    if (isProjRoute && projTitle) {
        breadcrumbItems.push({ 
            title: truncateText(projTitle, 12), 
            href: `/${segments.slice(0, 4).join("/")}`,
            isActive: isLeaderboardRoute || (!isStageRoute && !isTaskRoute)
        });
    }
    
    // Stage
    if (isStageRoute && stageTitle) {
        breadcrumbItems.push({ 
            title: truncateText(stageTitle, 12), 
            href: `/${segments.slice(0, 6).join("/")}`,
            isActive: !isTaskRoute
        });
    }
    
    // Task
    if (isTaskRoute && taskTitle) {
        breadcrumbItems.push({ 
            title: truncateText(taskTitle, 12), 
            href: "",
            isActive: true
        });
    }
    
    // Leaderboard
    if (isLeaderboardRoute && leaderboardTitle) {
        breadcrumbItems.push({ 
            title: leaderboardTitle, 
            href: "",
            isActive: true
        });
    }

    // 如果有超过3个项目，显示省略号
    let displayItems: BreadcrumbItemType[] = breadcrumbItems;
    if (breadcrumbItems.length > 4) {
        displayItems = [
            breadcrumbItems[0], // Home
            { title: "...", href: "", isEllipsis: true },
            ...breadcrumbItems.slice(-2) // 最后两个项目
        ];
    }

    return (
        <Breadcrumb className="hidden md:block">
            <BreadcrumbList className="text-white text-sm">
                {displayItems.map((item, index) => (
                    <Fragment key={index}>
                        {index > 0 && <BreadcrumbSeparator className="text-white" />}
                        <BreadcrumbItem>
                            {item.isEllipsis ? (
                                <BreadcrumbEllipsis className="text-white" />
                            ) : item.isActive ? (
                                <BreadcrumbPage className="text-white font-medium max-w-[120px] truncate" title={item.title}>
                                    {item.title}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink href={item.href} className="text-white hover:text-gray-200 max-w-[120px] truncate" title={item.title}>
                                    {item.title}
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export default Breadcrumbs
