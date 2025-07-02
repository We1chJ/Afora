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
import OrganizationScoreCard from './OrganizationScoreCard'

const OrganizationPage = ({ id }: { id: string }) => {
  const { user } = useUser();
  const [isMockMode, setIsMockMode] = useState(false);
  const [mockOrgData, setMockOrgData] = useState<Organization | null>(null);
  const [mockUserOrgData, setMockUserOrgData] = useState<UserOrgData | null>(null);

  // Check if this is the mock organization
  useEffect(() => {
    if (id === 'mock-org-123') {
      setIsMockMode(true);
      // Create mock organization data
      setMockOrgData({
        title: 'Test Organization',
        description: 'This is a mock organization for testing group score functionality',
        admins: ['admin@test.com'],
        members: ['alice@test.com', 'bob@test.com', 'charlie@test.com', 'david@test.com'],
        backgroundImage: '/logoFull.svg'
      });
      // Create mock user org data
      setMockUserOrgData({
        createdAt: new Date().toISOString(),
        role: 'admin',
        orgId: 'mock-org-123',
        userId: user?.primaryEmailAddress?.toString() || 'admin@test.com'
      });
    }
  }, [id, user]);

  const [org, loading, error] = useDocument(isMockMode ? null : doc(db, 'organizations', id));
  const [projectsData, projLoading, projError] = useCollection(isMockMode ? null : collection(db, 'organizations', id, 'projs'));
  const [data] = useDocument(user && user.primaryEmailAddress && !isMockMode ? doc(db, 'users', user.primaryEmailAddress.toString(), 'orgs', id) : null);

  const [userOrgData, setUserOrgData] = useState<UserOrgData>();
  
  useEffect(() => {
    if (isMockMode) {
      setUserOrgData(mockUserOrgData || undefined);
    } else if (data) {
      const userOrg = data.data() as UserOrgData;
      setUserOrgData(userOrg);
    }
  }, [data, isMockMode, mockUserOrgData])

  // Mock projects data
  const mockProjectsData = {
    docs: [
      {
        id: 'proj-1',
        data: () => ({
          projId: 'proj-1',
          title: 'Frontend Development Project',
          members: ['alice@test.com', 'bob@test.com'],
          orgId: 'mock-org-123'
        })
      },
      {
        id: 'proj-2',
        data: () => ({
          projId: 'proj-2',
          title: 'Backend Architecture Project',
          members: ['charlie@test.com', 'david@test.com'],
          orgId: 'mock-org-123'
        })
      }
    ]
  };

  if (isMockMode) {
    if (!mockOrgData) {
      return <div>Loading mock data...</div>;
    }
  } else {
    if (loading) {
      return;
    }

    if (error) {
      return <div>Error: {error.message}</div>;
    }

    if (!org) {
      return <div>No organization found</div>;
    }
  }

  const orgData = isMockMode ? mockOrgData! : org!.data()! as Organization;

  if (!orgData) {
    return <div>No organization found</div>;
  }

  return (
    <div className="overflow-x-hidden p-4">
      {/* Hero Section with Background Image */}
      <div className="relative w-full h-80 rounded-lg overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${orgData.backgroundImage})` }}
        />
        
        {/* Content Container */}
        <div className="relative h-full flex flex-col justify-between p-6">
          {/* Top Section */}
          <div className="flex justify-between items-start">
            {/* Project Onboarding */}
            {user && user.primaryEmailAddress && orgData && orgData.admins &&
              !orgData.admins.includes(user.primaryEmailAddress.toString()) && !isMockMode && (
              <div className="backdrop-blur-md bg-white/90 rounded-xl p-3 shadow-lg">
                <ProjOnboarding orgId={id} />
              </div>
            )}
            
            {/* Image Search Dialog */}
            <div className="ml-auto">
              {!isMockMode && (
                <div className="backdrop-blur-md bg-white/90 rounded-xl p-2 shadow-lg">
                  <ImageSearchDialog orgId={id} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="flex justify-between items-end">
            {/* Organization Title */}
            <div className="flex-1">
              <div className="backdrop-blur-md bg-white/75 rounded-xl p-4 inline-block">
                <h1 className="text-5xl font-bold text-gray-900 mb-2">
                  {orgData && orgData.title}
                </h1>
                {orgData && orgData.description && (
                  <p className="text-gray-700 text-lg max-w-2xl">
                    {orgData.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Access Code Card */}
            {userOrgData && userOrgData.role === 'admin' && (
              <div className="backdrop-blur-md bg-white/75 rounded-xl p-4 min-w-[200px]">
                <div className="text-sm font-medium text-gray-600 mb-1">Access Code</div>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    {userOrgData.orgId}
                  </code>
                  <Copy
                    className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(userOrgData.orgId);
                      toast.success('Access code copied to clipboard!');
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="projects" className="mt-6 w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1">
          <TabsTrigger value="projects" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Projects</TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="projects" className="mt-4">
          {user && user.primaryEmailAddress && userOrgData && (
            <ProjTab 
              userRole={userOrgData.role} 
              userId={user.primaryEmailAddress.toString()} 
              orgId={id} 
              projectsData={isMockMode ? mockProjectsData as any : projectsData} 
              loading={isMockMode ? false : projLoading} 
              error={isMockMode ? undefined : projError} 
              isMockMode={isMockMode} 
            />
          )}
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          {orgData && userOrgData && (
            <MemberList 
              userRole={userOrgData.role} 
              admins={orgData.admins} 
              members={orgData.members} 
              orgId={id} 
              projectsData={isMockMode ? mockProjectsData : projectsData} 
              isMockMode={isMockMode} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OrganizationPage