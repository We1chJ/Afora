'use client'
import React, { useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import InviteUserToOrganization from './InviteUserToOrganization';
import { useEffect, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Users, Settings, UserPlus, Shuffle, FolderOpen, UserCheck, ArrowRight, Crown, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface MemberListProps {
  admins: string[];
  members: string[];
  userRole: string;
  orgId: string;
  projectsData?: any;
  isMockMode?: boolean;
}

interface ProjectTeam {
  projectId: string;
  projectTitle: string;
  members: string[];
  teamSize: number;
}

const MemberList = ({ admins, members, userRole, orgId, projectsData, isMockMode = false }: MemberListProps) => {
    const [adminsPfp, setAdminsPfp] = useState<{ [email: string]: string }>({});
    const [membersPfp, setMembersPfp] = useState<{ [email: string]: string }>({});
    const [projectTeams, setProjectTeams] = useState<ProjectTeam[]>([]);
    const [unassignedMembers, setUnassignedMembers] = useState<string[]>([]);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [selectedView, setSelectedView] = useState<'overview' | 'projects'>('overview');
    const [isTeamSettingsOpen, setIsTeamSettingsOpen] = useState(false);
    const [defaultTeamSize, setDefaultTeamSize] = useState(3);
    
    const myQuery = !isMockMode ? query(
        collection(db, "users"),
        where("__name__", "in", [...admins, ...members])
    ) : null;
    const [results, loading, error] = useCollection(myQuery);

    // Get projects data
    const projects = useMemo(() => projectsData?.docs || [], [projectsData]);

    useEffect(() => {
        if (isMockMode || (!loading && results)) {
            const adminsPfpData: { [email: string]: string } = {};
            const membersPfpData: { [email: string]: string } = {};

            if (!isMockMode && results) {
                results.docs.forEach((doc) => {
                    const data = doc.data();
                    if (admins.includes(doc.id)) {
                        adminsPfpData[doc.id] = data.userImage;
                    } else if (members.includes(doc.id)) {
                        membersPfpData[doc.id] = data.userImage;
                    }
                });
            }

            setAdminsPfp(adminsPfpData);
            setMembersPfp(membersPfpData);
        }
    }, [results, loading, error, isMockMode]);

    // Initialize project teams
    useEffect(() => {
        const teams: ProjectTeam[] = projects.map((proj: any) => {
            const projectData = proj.data();
            return {
                projectId: projectData.projId || proj.id,
                projectTitle: projectData.title,
                members: projectData.members || [],
                teamSize: projectData.teamSize || defaultTeamSize
            };
        });
        
        setProjectTeams(teams);
        
        // Calculate unassigned members
        const assignedMembers = new Set(teams.flatMap(team => team.members));
        const unassigned = [...members, ...admins].filter(member => !assignedMembers.has(member));
        setUnassignedMembers(unassigned);
    }, [projects, members, admins, defaultTeamSize]);

    const handleAutoAssign = () => {
        const updatedTeams = [...projectTeams];
        let availableMembers = [...unassignedMembers];
        
        updatedTeams.forEach(team => {
            const spotsAvailable = team.teamSize - team.members.length;
            if (spotsAvailable > 0 && availableMembers.length > 0) {
                const membersToAdd = availableMembers.splice(0, spotsAvailable);
                team.members.push(...membersToAdd);
            }
        });
        
        setProjectTeams(updatedTeams);
        setUnassignedMembers(availableMembers);
        
        if (isMockMode) {
            toast.success('Members auto-assigned successfully! (Mock mode)');
        } else {
            toast.success('Members auto-assigned successfully!');
        }
    };

    const handleMemberMove = (memberEmail: string, fromProjectId: string | null, toProjectId: string | null) => {
        const updatedTeams = [...projectTeams];
        let updatedUnassigned = [...unassignedMembers];
        
        // Remove from source
        if (fromProjectId) {
            const sourceTeam = updatedTeams.find(team => team.projectId === fromProjectId);
            if (sourceTeam) {
                sourceTeam.members = sourceTeam.members.filter(member => member !== memberEmail);
            }
        } else {
            updatedUnassigned = updatedUnassigned.filter(member => member !== memberEmail);
        }
        
        // Add to destination
        if (toProjectId) {
            const destTeam = updatedTeams.find(team => team.projectId === toProjectId);
            if (destTeam && destTeam.members.length < destTeam.teamSize) {
                destTeam.members.push(memberEmail);
            } else {
                toast.error('Team is full!');
                return;
            }
        } else {
            updatedUnassigned.push(memberEmail);
        }
        
        setProjectTeams(updatedTeams);
        setUnassignedMembers(updatedUnassigned);
        
        if (isMockMode) {
            toast.success('Member moved successfully! (Mock mode)');
        } else {
            toast.success('Member moved successfully!');
        }
    };

    const updateTeamSize = (projectId: string, newSize: number) => {
        const updatedTeams = projectTeams.map(team => 
            team.projectId === projectId ? { ...team, teamSize: newSize } : team
        );
        setProjectTeams(updatedTeams);
    };

    const renderMemberCard = (memberEmail: string, isAdmin: boolean, showActions: boolean = false, projectId?: string) => {
        const pfpData = isAdmin ? adminsPfp : membersPfp;
        
        return (
            <div className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-200 transition-all duration-200">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img 
                            src={pfpData[memberEmail] || "https://static.vecteezy.com/system/resources/previews/024/983/914/non_2x/simple-user-default-icon-free-png.png"} 
                            alt="Avatar" 
                            className="w-12 h-12 rounded-full border-2 border-gray-100 object-cover" 
                        />
                        {isAdmin && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Crown className="h-3 w-3 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{memberEmail}</span>
                        {isAdmin && (
                            <Badge variant="secondary" className="text-xs w-fit mt-1">Admin</Badge>
                        )}
                    </div>
                </div>
                
                {showActions && userRole === 'admin' && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {projectId && (
                            <Button
                                 variant="ghost"
                                 size="sm"
                                 className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                                 onClick={() => handleMemberMove(memberEmail, projectId, null)}
                             >
                                 Remove
                             </Button>
                         )}
                         {!projectId && projectTeams.length > 0 && (
                             <Select onValueChange={(selectedProjectId) => handleMemberMove(memberEmail, null, selectedProjectId)}>
                                 <SelectTrigger className="w-32 h-8">
                                     <SelectValue placeholder="Add to" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectTeams
                                        .filter(team => team.members.length < team.teamSize)
                                        .map(team => (
                                            <SelectItem key={team.projectId} value={team.projectId}>
                                                {team.projectTitle}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const selectedProjectData = projectTeams.find(team => team.projectId === selectedProject);
    const totalMembers = [...admins, ...members].length;
    const assignedMembers = projectTeams.reduce((total, team) => total + team.members.length, 0);

    return (
        <div className="flex h-auto bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <Users className="h-6 w-6" />
                        </div>
                                                 <h2 className="text-xl font-bold">Team Management</h2>
                     </div>
                     
                     {/* Stats Cards */}
                     <div className="grid grid-cols-2 gap-3">
                         <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
                             <div className="text-2xl font-bold">{totalMembers}</div>
                             <div className="text-xs opacity-90">Total Members</div>
                         </div>
                         <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-lg">
                             <div className="text-2xl font-bold">{assignedMembers}</div>
                             <div className="text-xs opacity-90">Assigned</div>
                         </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="p-4 border-b border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                                                 <Button
                             variant={selectedView === 'overview' ? 'default' : 'outline'}
                             size="sm"
                             onClick={() => {setSelectedView('overview'); setSelectedProject(null);}}
                             className="flex items-center gap-2"
                         >
                             <Building2 className="h-4 w-4" />
                             Overview
                         </Button>
                         <Button
                             variant={selectedView === 'projects' ? 'default' : 'outline'}
                             size="sm"
                             onClick={() => setSelectedView('projects')}
                             className="flex items-center gap-2"
                         >
                             <FolderOpen className="h-4 w-4" />
                             Projects
                         </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4">
                {selectedView === 'overview' ? (
                         <div className="space-y-4">
                             <div className="text-sm font-medium text-gray-500">Organization Overview</div>
                             <Card className="border-0 shadow-sm">
                                 <CardContent className="p-4">
                                     <div className="space-y-3">
                                         <div className="flex justify-between items-center">
                                             <span className="text-sm text-gray-600">Admins</span>
                                             <Badge variant="secondary">{admins.length}</Badge>
                                         </div>
                                         <div className="flex justify-between items-center">
                                             <span className="text-sm text-gray-600">Members</span>
                                             <Badge variant="secondary">{members.length}</Badge>
                                         </div>
                                         <div className="flex justify-between items-center">
                                             <span className="text-sm text-gray-600">Active Projects</span>
                                             <Badge variant="secondary">{projectTeams.length}</Badge>
                                         </div>
                                         <Separator />
                                         <div className="flex justify-between items-center">
                                             <span className="text-sm text-gray-600">Unassigned Members</span>
                                             <Badge variant={unassignedMembers.length > 0 ? "destructive" : "default"}>
                                                 {unassignedMembers.length}
                                             </Badge>
                                         </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        ) : (
                        <div className="space-y-3">
                            <div className="text-sm font-medium text-gray-500">Project List</div>
                            {projectTeams.map((team) => (
                                <div
                                    key={team.projectId}
                                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                        selectedProject === team.projectId
                                            ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:shadow-sm'
                                    }`}
                                    onClick={() => setSelectedProject(team.projectId)}
                                >
                                    <div className="flex items-center gap-3">
                                        <FolderOpen className={`h-5 w-5 ${
                                            selectedProject === team.projectId ? 'text-blue-600' : 'text-gray-400'
                                        }`} />
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium truncate ${
                                                selectedProject === team.projectId ? 'text-blue-900' : 'text-gray-900'
                                            }`}>
                                                {team.projectTitle}
                                            </div>
                                                <div className="text-sm text-gray-500">
                                                    {team.members.length}/{team.teamSize} members
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge variant={team.members.length === team.teamSize ? "default" : "secondary"}>
                                                    {team.members.length === team.teamSize ? 'Full' : 'Available'}
                                                </Badge>
                                            {selectedProject === team.projectId && (
                                                <ArrowRight className="h-4 w-4 text-blue-600" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Unassigned Section */}
                            <div
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                    selectedProject === 'unassigned'
                                        ? 'bg-orange-50 border-2 border-orange-200 shadow-md'
                                        : 'bg-orange-25 border border-orange-200 hover:bg-orange-50'
                                }`}
                                onClick={() => setSelectedProject('unassigned')}
                            >
                                <div className="flex items-center gap-3">
                                    <UserPlus className={`h-5 w-5 ${
                                        selectedProject === 'unassigned' ? 'text-orange-600' : 'text-orange-400'
                                    }`} />
                                    <div className="flex-1">
                                        <div className={`font-medium ${
                                            selectedProject === 'unassigned' ? 'text-orange-900' : 'text-orange-700'
                                        }`}>
                                                Unassigned Members
                                            </div>
                                            <div className="text-sm text-orange-600">
                                                {unassignedMembers.length} members
                                            </div>
                                    </div>
                                    {selectedProject === 'unassigned' && (
                                        <ArrowRight className="h-4 w-4 text-orange-600" />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-2">
                        {userRole === 'admin' && (
                            <>
                                <Dialog open={isTeamSettingsOpen} onOpenChange={setIsTeamSettingsOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full" size="sm">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Team Settings
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Team Settings</DialogTitle>
                                            <DialogDescription>
                                                Configure team sizes and assignment settings.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-sm font-medium">Default Team Size</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    value={defaultTeamSize}
                                                    onChange={(e) => setDefaultTeamSize(parseInt(e.target.value) || 3)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={() => setIsTeamSettingsOpen(false)}>Close</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                
                                <Button 
                                    onClick={handleAutoAssign} 
                                    disabled={unassignedMembers.length === 0}
                                    className="w-full"
                                    size="sm"
                                >
                                    <Shuffle className="h-4 w-4 mr-2" />
                                    Auto Assign
                                </Button>
                            </>
                        )}
                        <InviteUserToOrganization />
                    </div>
                </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Content Header */}
                <div className="p-6 border-b border-gray-200 bg-white">
                                         {selectedView === 'overview' ? (
                         <div>
                             <h3 className="text-lg font-semibold text-gray-900">Organization Members Overview</h3>
                             <p className="text-sm text-gray-500">View detailed information about all organization members</p>
                         </div>
                     ) : selectedProject && selectedProject !== 'unassigned' ? (
                         <div className="flex items-center justify-between">
                             <div>
                                 <h3 className="text-lg font-semibold text-gray-900">
                                     {selectedProjectData?.projectTitle}
                                 </h3>
                                 <p className="text-sm text-gray-500">
                                     {selectedProjectData?.members.length}/{selectedProjectData?.teamSize} team members
                                 </p>
                             </div>
                             {userRole === 'admin' && selectedProjectData && (
                                 <div className="flex items-center gap-2">
                                     <span className="text-sm text-gray-500">Team Size:</span>
                                    <Select
                                        value={selectedProjectData.teamSize.toString()}
                                        onValueChange={(value) => updateTeamSize(selectedProject, parseInt(value))}
                                    >
                                        <SelectTrigger className="w-20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[2,3,4,5,6,7,8].map(size => (
                                                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                                         ) : selectedProject === 'unassigned' ? (
                         <div>
                             <h3 className="text-lg font-semibold text-gray-900">Unassigned Members</h3>
                             <p className="text-sm text-gray-500">
                                 {unassignedMembers.length} members not assigned to projects
                             </p>
                         </div>
                     ) : (
                         <div>
                             <h3 className="text-lg font-semibold text-gray-900">Select Project</h3>
                             <p className="text-sm text-gray-500">Select a project from the left to view team members</p>
                         </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {selectedView === 'overview' ? (
                        <div className="space-y-6">
                                                         {/* Admins Section */}
                             <div>
                                 <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                                     <Crown className="h-4 w-4 text-yellow-500" />
                                     Admins ({admins.length})
                                 </h4>
                                 <div className="grid gap-3">
                                     {admins.map((admin) => (
                                         <div key={admin}>
                                             {renderMemberCard(admin, true)}
                                         </div>
                                     ))}
                                 </div>
                             </div>
 
                             <Separator />
 
                             {/* Members Section */}
                             <div>
                                 <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                                     <Users className="h-4 w-4 text-blue-500" />
                                     Members ({members.length})
                                 </h4>
                                <div className="grid gap-3">
                                    {members.map((member) => (
                                        <div key={member}>
                                            {renderMemberCard(member, false)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : selectedProject && selectedProject !== 'unassigned' ? (
                        <div className="space-y-6">
                                                         {/* Project Team Members */}
                             {selectedProjectData && selectedProjectData.members.length > 0 && (
                                 <div>
                                     <h4 className="text-sm font-medium text-gray-700 mb-4">Current Team Members</h4>
                                     <div className="grid gap-3">
                                         {selectedProjectData.members.map((member) => (
                                             <div key={member}>
                                                 {renderMemberCard(member, admins.includes(member), true, selectedProject)}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
 
                             {/* Available Spots */}
                             {selectedProjectData && selectedProjectData.members.length < selectedProjectData.teamSize && (
                                 <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
                                     <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                     <p className="text-gray-600 font-medium">
                                         {selectedProjectData.teamSize - selectedProjectData.members.length} spots available
                                     </p>
                                     {userRole === 'admin' && unassignedMembers.length > 0 && (
                                         <p className="text-sm text-gray-400 mt-2">
                                             Select "Unassigned Members" from the left to add members
                                         </p>
                                     )}
                                 </div>
                             )}
                        </div>
                    ) : selectedProject === 'unassigned' ? (
                                                 <div className="space-y-4">
                             {unassignedMembers.length > 0 ? (
                                 <div>
                                     <h4 className="text-sm font-medium text-gray-700 mb-4">Members to be assigned</h4>
                                     <div className="grid gap-3">
                                         {unassignedMembers.map((member) => (
                                             <div key={member}>
                                                 {renderMemberCard(member, admins.includes(member), true)}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             ) : (
                                 <div className="text-center py-12">
                                     <UserCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                     <h3 className="text-lg font-medium text-gray-900 mb-2">All members assigned</h3>
                                     <p className="text-gray-500">All organization members have been assigned to project teams.</p>
                                 </div>
                             )}
                         </div>
                     ) : (
                         <div className="text-center py-12">
                             <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                             <h3 className="text-lg font-medium text-gray-900 mb-2">Select project to view details</h3>
                             <p className="text-gray-500">Select a project from the left project list to view team members.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MemberList