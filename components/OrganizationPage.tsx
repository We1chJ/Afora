'use client'

import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCollection, useDocument } from 'react-firebase-hooks/firestore'
import { collection, doc } from 'firebase/firestore'
import { db } from '@/firebase'
import MemberList from './MemberList'
import ProjOnboarding from './ProjOnboarding'
import { Organization, UserOrgData } from '@/types/types'
import { useUser } from '@clerk/nextjs'
import ProjTab from './ProjTab'
import { Copy } from 'lucide-react';
import { toast } from 'sonner'
import ImageSearchDialog from './ImageSearchDialog'

const OrganizationPage = ({ id }: { id: string }) => {
  const { user } = useUser();

  const [org, loading, error] = useDocument(doc(db, 'organizations', id));
  const [projectsData, projLoading, projError] = useCollection(collection(db, 'organizations', id, 'projs'));
  const [data] = useDocument(user && user.primaryEmailAddress && doc(db, 'users', user.primaryEmailAddress.toString(), 'orgs', id));

  const [userOrgData, setUserOrgData] = useState<UserOrgData>();
  useEffect(() => {
    if (data) {
      const userOrg = data.data() as UserOrgData;
      setUserOrgData(userOrg);
    }
  }, [data])

  if (loading) {
    return;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!org) {
    return <div>No organization found</div>;
  }

  const orgData = org!.data()! as Organization;

  if (!orgData) {
    return <div>No organization found</div>;
  }

  return (
    <div className="overflow-x-hidden p-4">
      <div
        className="flex items-center justify-between bg-cover bg-center p-4 h-64 rounded-lg relative"
        style={{ backgroundImage: "url('https://imagifly.co/web/img/articles/abstract-wallpaper/midjourney-wallpaper-1.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {user && user.primaryEmailAddress && orgData && orgData.admins &&
          !orgData.admins.includes(user.primaryEmailAddress.toString()) && <ProjOnboarding orgId={id} />}
        <h1 className="text-4xl font-bold m-4 text-white">
          {orgData && orgData.title}
        </h1>
        {userOrgData && userOrgData.role === 'admin' &&
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-75 p-3 shadow-md rounded-lg">
            <h2 className="text-m font-semibold">
              Access Code:
              <br />
              {userOrgData.orgId}
              <Copy
                className="inline-block ml-2 cursor-pointer hover:bg-gray-200 rounded-md p-0.5"
                onClick={() => {
                  navigator.clipboard.writeText(userOrgData.orgId);
                  toast.success('Access code copied to clipboard!');
                }}
              />
            </h2>
          </div>
        }
        <div className='w-full'>
          <ImageSearchDialog />
        </div>
      </div>
      <Tabs defaultValue="projects" className="mt-2 w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          {/* <TabsTrigger value="settings">Settings</TabsTrigger> */}
        </TabsList>
        <TabsContent value="projects">{user && user.primaryEmailAddress && userOrgData && <ProjTab userRole={userOrgData.role} userId={user.primaryEmailAddress.toString()} orgId={id} projectsData={projectsData} loading={projLoading} error={projError} />}</TabsContent>
        <TabsContent value="members">{orgData && userOrgData && <MemberList userRole={userOrgData.role} admins={orgData.admins} members={orgData.members} />}</TabsContent>
        {/* <TabsContent value="settings">Organization settings and preferences.</TabsContent> */}
      </Tabs>
    </div>
  )
}

export default OrganizationPage