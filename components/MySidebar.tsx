'use client';

import { Home } from "lucide-react"
import { useCollection } from "react-firebase-hooks/firestore"
import { useUser } from "@clerk/nextjs";
import { collection, DocumentData, query, where } from "firebase/firestore";
import { db } from '@/firebase'
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Organization } from "@/types/types";


interface OrgDocument extends DocumentData {
  createdAt: string;
  role: string;
  orgId: string;
  userId: string;
  orgTitle: string;
}

function MySidebar() {
  const { user } = useUser()

  const userId = user?.id || "nonemptyString";
  const [userOrgs] = useCollection(collection(db, "users", userId, "orgs"));

  const [orgIds, setOrgIds] = useState<string[]>([]);
  const [orgMap, setOrgMap] = useState<Map<string, string>>(new Map());

  // Memoize the query to maintain stability
  const orgQuery = useMemo(() =>
    orgIds.length ?
      query(
        collection(db, 'organizations'),
        where('__name__', 'in', orgIds)
      )
      : null
    , [orgIds]);

  const [value, loading, error] = useCollection(orgQuery);

  // Get orgIds from userOrgs
  useEffect(() => {
    if (!userOrgs) return;
    console.log(userOrgs);
    const orgDocs = userOrgs.docs.map((doc) => doc.data() as OrgDocument);
    const ids = orgDocs.map((org) => org.orgId);
    setOrgIds(ids);
  }, [userOrgs]);

  // Create map from organizations collection data
  useEffect(() => {
    if (!value) return;

    const newOrgMap = new Map<string, string>();
    value.docs.forEach(doc => {
      const data = doc.data() as Organization;
      newOrgMap.set(doc.id, data.title); // Assuming the title field is called 'title'
    });

    setOrgMap(newOrgMap);
  }, [value]);

  return (
    <div className="h-screen">
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarHeader className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <SidebarMenuButton asChild>
              <Link href="/" className="flex items-center space-x-2">
                <Home className="w-5 h-5" />
                <span className="font-bold">Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarHeader>
          <SidebarGroup>
            <SidebarGroupLabel>Organizations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {!loading && !error && orgMap && Array.from(orgMap.entries()).map(([id, title]) => (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton asChild>
                      <Link className="group-data-[collapsible=icon]:hidden" href={`/org/${id}`}>
                        <span className="truncate border-e-indigo-50 font-bold">{title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </div>
  )
}
export default MySidebar