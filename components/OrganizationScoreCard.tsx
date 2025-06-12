'use client'
import React, { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { analyzeTeamCompatibility } from '@/ai_scripts/analyzeTeamCompatibility'
import { appQuestions, TeamCompatibilityAnalysis } from '@/types/types'
import { getOrganizationMembersResponses } from '@/actions/actions'
import { getMockOrganizationMembersResponses } from '@/actions/mockActions'
import { toast } from 'sonner'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import TeamScoreChart from './TeamScoreChart'

interface OrganizationScoreCardProps {
  orgId: string;
  members: string[];
  mockData?: boolean; // Used for displaying mock data
}

const OrganizationScoreCard = ({ orgId, members, mockData = false }: OrganizationScoreCardProps) => {
  const [analysis, setAnalysis] = useState<TeamCompatibilityAnalysis | null>(null);
  const [isPending, startTransition] = useTransition();

  // Mock data
  const mockAnalysis: TeamCompatibilityAnalysis = {
    overall_score: 85,
    member_analyses: [
      {
        member_email: "alice@example.com",
        strengths: ["Frontend Development", "UI/UX Design", "Team Collaboration"],
        skills: ["React", "TypeScript", "Figma", "CSS"],
        interests: ["User Experience", "Mobile Development", "Design Systems"],
        compatibility_score: 88,
        role_suggestion: "Frontend Development Lead"
      },
      {
        member_email: "bob@example.com", 
        strengths: ["Backend Development", "Database Design", "System Architecture"],
        skills: ["Node.js", "PostgreSQL", "Docker", "AWS"],
        interests: ["Cloud Computing", "Microservices", "DevOps"],
        compatibility_score: 82,
        role_suggestion: "Backend Architect"
      },
      {
        member_email: "charlie@example.com",
        strengths: ["Project Management", "Business Analysis", "Communication"],
        skills: ["Scrum", "Data Analysis", "Product Planning", "Excel"],
        interests: ["Product Management", "User Research", "Market Analysis"],
        compatibility_score: 87,
        role_suggestion: "Project Manager"
      }
    ],
    team_analysis: {
      team_strengths: ["Strong skill complementarity", "Full-stack coverage", "Clear role division", "Good communication and collaboration"],
      potential_gaps: ["Lack of dedicated testing personnel", "Limited mobile development experience", "Limited marketing and promotion capabilities"],
      collaboration_potential: "Team members have highly complementary skills with a strong collaboration foundation. Frontend, backend, and project management roles are clearly defined, and the team is expected to collaborate efficiently to achieve project goals.",
      recommendations: [
        "Consider adding a QA testing engineer",
        "Provide mobile development training for team members",
        "Establish regular technical sharing sessions",
        "Define clear code review processes"
      ]
    }
  };

  const generateMockMemberResponses = () => {
    return [
      `User: alice@example.com
Question 1 Answer: React,TypeScript,UI/UX Design,CSS,JavaScript
Question 2 Answer: Web Development,Frontend Development,Mobile Development
Question 3 Answer: Senior Frontend Developer,UI/UX Designer,Product Manager`,
      
      `User: bob@example.com  
Question 1 Answer: Node.js,PostgreSQL,Docker,AWS,System Architecture
Question 2 Answer: Backend Development,Cloud Computing,DevOps
Question 3 Answer: Backend Architect,DevOps Engineer,Technical Lead`,
      
      `User: charlie@example.com
Question 1 Answer: Project Management,Scrum,Data Analysis,Business Analysis
Question 2 Answer: Product Management,Business Strategy,Team Leadership  
Question 3 Answer: Project Manager,Product Manager,Business Analyst`
    ];
  };

  const handleAnalyzeTeam = async () => {
    // Always use real GPT API, but data source depends on mockData flag
    startTransition(() => {
      (async () => {
        try {
          // Get user survey responses (use mock data if mockData is true)
          const membersData = mockData 
            ? await getMockOrganizationMembersResponses(orgId)
            : await getOrganizationMembersResponses(orgId);
          
          if (!membersData.success || !membersData.data || membersData.data.length === 0) {
            const errorMessage = mockData 
              ? 'Mock data not found, using generated mock responses'
              : 'No team member survey responses found, using mock data for demonstration';
            toast.error(errorMessage);
            
            // If no data, use generated mock responses
            const memberResponses = generateMockMemberResponses();
            const result = await analyzeTeamCompatibility(appQuestions, memberResponses);
            const parsedResult: TeamCompatibilityAnalysis = JSON.parse(result);
            setAnalysis(parsedResult);
            return;
          }

          // Format member response data
          const memberResponses = membersData.data.map((member: any) => {
            return `User: ${member.email}
Question 1 Answer: ${member.responses[0] || 'No answer'}
Question 2 Answer: ${member.responses[1] || 'No answer'}
Question 3 Answer: ${member.responses[2] || 'No answer'}`;
          });
          
          const result = await analyzeTeamCompatibility(appQuestions, memberResponses);
          const parsedResult: TeamCompatibilityAnalysis = JSON.parse(result);
          setAnalysis(parsedResult);
          
          const successMessage = mockData 
            ? 'GPT team analysis completed!'
            : 'Team analysis completed!';
          toast.success(successMessage);
        } catch (error) {
          console.error('Analysis failed:', error);
          const errorMessage = mockData
            ? 'GPT analysis failed, using mock data for demonstration'
            : 'Analysis failed, using mock data for demonstration';
          toast.error(errorMessage);
          // Fallback to mock data on error
          setAnalysis(mockAnalysis);
        }
      })();
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Average';
    if (score >= 60) return 'Needs Improvement';
    return 'Major Adjustments Needed';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Compatibility Analysis
          </CardTitle>
          <CardDescription>
            Analyze team's overall compatibility and collaboration potential based on member onboarding surveys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!analysis ? (
            <div className="text-center py-8">
              <Button onClick={handleAnalyzeTeam} disabled={isPending} size="lg">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Analyzing...' : 'Start Team Analysis'}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Current team member count: {members.length}
                {mockData && <span className="text-blue-600"> (Will use mock data to call real GPT API)</span>}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Chart visualization */}
              <TeamScoreChart analysis={analysis} />

              {/* Overall score */}
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(analysis.overall_score)} mb-2`}>
                  {analysis.overall_score}
                </div>
                <div className="text-lg text-muted-foreground mb-4">
                  Overall Compatibility - {getScoreDescription(analysis.overall_score)}
                </div>
                <Progress value={analysis.overall_score} className="w-full max-w-md mx-auto" />
              </div>

              {/* Team overall analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Team Overall Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Team Strengths
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.team_analysis.team_strengths.map((strength, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Potential Gaps
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.team_analysis.potential_gaps.map((gap, index) => (
                        <Badge key={index} variant="outline" className="border-orange-300 text-orange-700">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Collaboration Potential Assessment</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysis.team_analysis.collaboration_potential}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Improvement Recommendations</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {analysis.team_analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Member detailed analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Member Detailed Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {analysis.member_analyses.map((member, index) => (
                      <AccordionItem key={member.member_email} value={`member-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-2">
                            <span className="font-medium">{member.member_email}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${getScoreColor(member.compatibility_score)}`}>
                                {member.compatibility_score} pts
                              </span>
                              <Badge variant="outline">{member.role_suggestion}</Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                          <div>
                            <h5 className="font-medium text-sm mb-1">Core Strengths</h5>
                            <div className="flex flex-wrap gap-1">
                              {member.strengths.map((strength, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {strength}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-sm mb-1">Technical Skills</h5>
                            <div className="flex flex-wrap gap-1">
                              {member.skills.map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-sm mb-1">Areas of Interest</h5>
                            <div className="flex flex-wrap gap-1">
                              {member.interests.map((interest, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationScoreCard; 