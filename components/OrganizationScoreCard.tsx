"use client";
import React, { useState, useTransition } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Loader2,
    Users,
    TrendingUp,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { analyzeTeamCompatibility } from "@/ai_scripts/analyzeTeamCompatibility";
import { appQuestions, TeamCompatibilityAnalysis } from "@/types/types";
import { getOrganizationMembersResponses } from "@/actions/actions";
import { getMockOrganizationMembersResponses } from "@/actions/mockActions";
import { toast } from "sonner";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import TeamScoreChart from "./TeamScoreChart";

interface OrganizationScoreCardProps {
    orgId: string;
    members: string[];
    mockData?: boolean; // Used for displaying mock data
    projectFilter?: string; // Optional project filter for project-specific analysis
}

const OrganizationScoreCard = ({
    orgId,
    members,
    mockData = false,
    projectFilter,
}: OrganizationScoreCardProps) => {
    const [analysis, setAnalysis] = useState<TeamCompatibilityAnalysis | null>(
        null,
    );
    const [isPending, startTransition] = useTransition();

    // Mock data
    const mockAnalysis: TeamCompatibilityAnalysis = {
        overall_score: 85,
        member_analyses: [
            {
                member_email: "alice@example.com",
                strengths: [
                    "Frontend Development",
                    "UI/UX Design",
                    "Team Collaboration",
                ],
                skills: ["React", "TypeScript", "Figma", "CSS"],
                interests: [
                    "User Experience",
                    "Mobile Development",
                    "Design Systems",
                ],
                compatibility_score: 88,
                role_suggestion: "Frontend Development Lead",
                detailed_analysis: {
                    technical_proficiency: {
                        score: 92,
                        strengths: ["Modern Frontend Frameworks", "UI Component Design", "Performance Optimization"],
                        areas_for_improvement: ["Mobile-First Development", "Testing Automation"]
                    },
                    collaboration_style: {
                        preferred_methods: ["Slack", "Video Calls", "Design Reviews"],
                        communication_frequency: "Daily stand-ups and as-needed discussions",
                        team_role: "Technical Lead & Design System Architect"
                    },
                    project_contribution: {
                        primary_responsibilities: ["Frontend Architecture", "UI Component Library", "Design System Implementation"],
                        potential_impact: "Can significantly improve development efficiency through component standardization",
                        risk_factors: ["Time division between development and design tasks", "Potential bottleneck in design decisions"]
                    }
                }
            },
            {
                member_email: "bob@example.com",
                strengths: [
                    "Backend Development",
                    "Database Design",
                    "System Architecture",
                ],
                skills: ["Node.js", "PostgreSQL", "Docker", "AWS"],
                interests: ["Cloud Computing", "Microservices", "DevOps"],
                compatibility_score: 82,
                role_suggestion: "Backend Architect",
                detailed_analysis: {
                    technical_proficiency: {
                        score: 88,
                        strengths: ["Database Optimization", "API Design", "Cloud Infrastructure"],
                        areas_for_improvement: ["Documentation", "Frontend Integration"]
                    },
                    collaboration_style: {
                        preferred_methods: ["GitHub Discussions", "Technical Documentation", "Architecture Reviews"],
                        communication_frequency: "Bi-weekly architecture reviews and daily updates",
                        team_role: "Backend Lead & Infrastructure Specialist"
                    },
                    project_contribution: {
                        primary_responsibilities: ["API Development", "Database Architecture", "Cloud Infrastructure"],
                        potential_impact: "Will establish robust and scalable backend foundation",
                        risk_factors: ["Complex technical decisions", "Integration challenges"]
                    }
                }
            },
            {
                member_email: "charlie@example.com",
                strengths: [
                    "Project Management",
                    "Business Analysis",
                    "Communication",
                ],
                skills: ["Scrum", "Data Analysis", "Product Planning", "Excel"],
                interests: [
                    "Product Management",
                    "User Research",
                    "Market Analysis",
                ],
                compatibility_score: 87,
                role_suggestion: "Project Manager",
                detailed_analysis: {
                    technical_proficiency: {
                        score: 85,
                        strengths: ["Project Planning", "Risk Management", "Stakeholder Communication"],
                        areas_for_improvement: ["Technical Documentation", "Agile Methodologies"]
                    },
                    collaboration_style: {
                        preferred_methods: ["Regular Team Meetings", "Email Updates", "One-on-One Sessions"],
                        communication_frequency: "Daily check-ins and weekly detailed reviews",
                        team_role: "Project Coordinator & Team Facilitator"
                    },
                    project_contribution: {
                        primary_responsibilities: ["Project Planning", "Team Coordination", "Resource Management"],
                        potential_impact: "Will ensure smooth project execution and team alignment",
                        risk_factors: ["Balancing technical and business priorities", "Team communication overhead"]
                    }
                }
            }
        ],
        team_analysis: {
            team_strengths: [
                "Strong skill complementarity",
                "Full-stack coverage",
                "Clear role division",
                "Good communication and collaboration",
            ],
            potential_gaps: [
                "Lack of dedicated testing personnel",
                "Limited mobile development experience",
                "Limited marketing and promotion capabilities",
            ],
            collaboration_potential:
                "Team members have highly complementary skills with a strong collaboration foundation. Frontend, backend, and project management roles are clearly defined, and the team is expected to collaborate efficiently to achieve project goals.",
            recommendations: [
                "Consider adding a QA testing engineer",
                "Provide mobile development training for team members",
                "Establish regular technical sharing sessions",
                "Define clear code review processes",
            ],
            project_fit: {
                technical_alignment: 85,
                schedule_compatibility: 78,
                interest_alignment: 92,
                charter_alignment: {
                    vision_alignment: 88,
                    values_compatibility: 85,
                    key_findings: [
                        "Team shares a strong vision for project success",
                        "Values align well with project goals",
                        "Some minor differences in working style preferences",
                        "High commitment to quality and innovation"
                    ],
                    detailed_assessment: {
                        shared_values: [
                            "Quality-First Development",
                            "User-Centric Design",
                            "Continuous Learning",
                            "Open Communication"
                        ],
                        potential_conflicts: [
                            "Different preferences in work scheduling",
                            "Varying opinions on technical debt priorities"
                        ],
                        team_culture: "Collaborative and innovation-focused with emphasis on technical excellence",
                        decision_making: "Consensus-driven with clear technical leadership hierarchy"
                    }
                },
                technical_assessment: {
                    skill_coverage: {
                        strong_areas: ["Frontend Development", "API Design", "Cloud Infrastructure"],
                        weak_areas: ["Mobile Development", "Security Testing"],
                        coverage_percentage: 85
                    },
                    technology_stack: {
                        frontend: ["React", "TypeScript", "Next.js", "TailwindCSS"],
                        backend: ["Node.js", "PostgreSQL", "Redis", "Docker"],
                        other: ["AWS", "GitHub Actions", "Jest"]
                    },
                    expertise_distribution: {
                        junior: 20,
                        mid: 50,
                        senior: 30
                    }
                },
                schedule_assessment: {
                    overlap_hours: 6,
                    peak_availability: ["10:00-16:00 EST"],
                    timezone_distribution: ["EST", "PST", "GMT"],
                    flexibility_score: 75
                },
                comments: [
                    "Team's technical stack aligns well with project requirements",
                    "Some schedule conflicts may need adjustment",
                    "High interest in project goals and technologies",
                    "Strong potential for innovative solutions"
                ]
            }
        },
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
Question 3 Answer: Project Manager,Product Manager,Business Analyst`,
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

                    if (
                        !membersData.success ||
                        !membersData.data ||
                        membersData.data.length === 0
                    ) {
                        const errorMessage = mockData
                            ? "Mock data not found, using generated mock responses"
                            : "No team member survey responses found, using mock data for demonstration";
                        toast.error(errorMessage);

                        // If no data, use generated mock responses
                        const memberResponses = generateMockMemberResponses();
                        const result = await analyzeTeamCompatibility(
                            appQuestions,
                            memberResponses,
                        );
                        const parsedResult: TeamCompatibilityAnalysis =
                            JSON.parse(result);
                        setAnalysis(parsedResult);
                        return;
                    }

                    // Format member response data
                    const memberResponses = membersData.data.map(
                        (member: any) => {
                            return `User: ${member.email}
Question 1 Answer: ${member.responses[0] || "No answer"}
Question 2 Answer: ${member.responses[1] || "No answer"}
Question 3 Answer: ${member.responses[2] || "No answer"}`;
                        },
                    );

                    const result = await analyzeTeamCompatibility(
                        appQuestions,
                        memberResponses,
                    );
                    const parsedResult: TeamCompatibilityAnalysis =
                        JSON.parse(result);
                    setAnalysis(parsedResult);

                    const successMessage = mockData
                        ? "GPT team analysis completed!"
                        : "Team analysis completed!";
                    toast.success(successMessage);
                } catch (error) {
                    console.error("Analysis failed:", error);
                    const errorMessage = mockData
                        ? "GPT analysis failed, using mock data for demonstration"
                        : "Analysis failed, using mock data for demonstration";
                    toast.error(errorMessage);
                    // Fallback to mock data on error
                    setAnalysis(mockAnalysis);
                }
            })();
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-600";
        if (score >= 80) return "text-blue-600";
        if (score >= 70) return "text-yellow-600";
        if (score >= 60) return "text-orange-600";
        return "text-red-600";
    };

    const getScoreDescription = (score: number) => {
        if (score >= 90) return "Excellent";
        if (score >= 80) return "Good";
        if (score >= 70) return "Average";
        if (score >= 60) return "Needs Improvement";
        return "Major Adjustments Needed";
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {projectFilter
                            ? "Project Team Compatibility Analysis"
                            : "Team Compatibility Analysis"}
                    </CardTitle>
                    <CardDescription>
                        {projectFilter
                            ? "Analyze this project team's compatibility and collaboration potential based on member profiles"
                            : "Analyze team's overall compatibility and collaboration potential based on member onboarding surveys"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!analysis ? (
                        <div className="text-center py-8">
                            <Button
                                onClick={handleAnalyzeTeam}
                                disabled={isPending}
                                size="lg"
                            >
                                {isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isPending
                                    ? "Analyzing..."
                                    : "Start Team Analysis"}
                            </Button>
                            <p className="text-sm text-muted-foreground mt-2">
                                Current team member count: {members.length}
                                {mockData && (
                                    <span className="text-blue-600">
                                        {" "}
                                        (Will use mock data to call real GPT
                                        API)
                                    </span>
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Chart visualization */}
                            <TeamScoreChart analysis={analysis} />

                            {/* Overall score */}
                            <div className="text-center">
                                <div
                                    className={`text-6xl font-bold ${getScoreColor(analysis.overall_score)} mb-2`}
                                >
                                    {analysis.overall_score}
                                </div>
                                <div className="text-lg text-muted-foreground mb-4">
                                    Overall Compatibility -{" "}
                                    {getScoreDescription(
                                        analysis.overall_score,
                                    )}
                                </div>
                                <Progress
                                    value={analysis.overall_score}
                                    className="w-full max-w-md mx-auto"
                                />
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
                                            {analysis.team_analysis.team_strengths.map(
                                                (strength, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="secondary"
                                                        className="bg-green-100 text-green-800"
                                                    >
                                                        {strength}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Potential Gaps
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {analysis.team_analysis.potential_gaps.map(
                                                (gap, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="outline"
                                                        className="border-orange-300 text-orange-700"
                                                    >
                                                        {gap}
                                                    </Badge>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            Collaboration Potential Assessment
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {
                                                analysis.team_analysis
                                                    .collaboration_potential
                                            }
                                        </p>
                                    </div>

                                    {/* Project Fit Analysis */}
                                    {analysis.team_analysis.project_fit && (
                                        <>
                                            {/* Technical Assessment */}
                                            {analysis.team_analysis.project_fit?.technical_assessment && (
                                                <div className="mt-6">
                                                    <h4 className="font-semibold mb-4">Technical Assessment</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 p-4 rounded-lg">
                                                            <h5 className="text-sm font-medium text-slate-700 mb-2">Skill Coverage</h5>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <span className="text-sm text-slate-600">Coverage:</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg font-bold text-blue-600">
                                                                            {analysis.team_analysis.project_fit.technical_assessment.skill_coverage?.coverage_percentage || 0}%
                                                                        </span>
                                                                        <Progress 
                                                                            value={analysis.team_analysis.project_fit.technical_assessment.skill_coverage?.coverage_percentage || 0} 
                                                                            className="flex-1"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm text-green-600">Strong Areas:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {analysis.team_analysis.project_fit.technical_assessment.skill_coverage?.strong_areas.map((area, i) => (
                                                                            <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">
                                                                                {area}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm text-orange-600">Areas for Improvement:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {analysis.team_analysis.project_fit.technical_assessment.skill_coverage?.weak_areas.map((area, i) => (
                                                                            <Badge key={i} variant="outline" className="border-orange-300 text-orange-700">
                                                                                {area}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-slate-50 p-4 rounded-lg">
                                                            <h5 className="text-sm font-medium text-slate-700 mb-2">Technology Stack</h5>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <span className="text-sm text-blue-600">Frontend:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {analysis.team_analysis.project_fit.technical_assessment.technology_stack?.frontend.map((tech, i) => (
                                                                            <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">
                                                                                {tech}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm text-purple-600">Backend:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {analysis.team_analysis.project_fit.technical_assessment.technology_stack?.backend.map((tech, i) => (
                                                                            <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800">
                                                                                {tech}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm text-gray-600">Other:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {analysis.team_analysis.project_fit.technical_assessment.technology_stack?.other.map((tech, i) => (
                                                                            <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-800">
                                                                                {tech}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Schedule Assessment */}
                                            {analysis.team_analysis.project_fit?.schedule_assessment && (
                                                <div className="mt-6">
                                                    <h4 className="font-semibold mb-4">Schedule Assessment</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 p-4 rounded-lg">
                                                            <h5 className="text-sm font-medium text-slate-700 mb-2">Time Overlap</h5>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <span className="text-sm text-slate-600">Common Hours:</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg font-bold text-blue-600">
                                                                            {analysis.team_analysis.project_fit.schedule_assessment?.overlap_hours || 0}h
                                                                        </span>
                                                                        <span className="text-sm text-slate-500">per day</span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm text-slate-600">Peak Availability:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {analysis.team_analysis.project_fit.schedule_assessment?.peak_availability?.map((time, i) => (
                                                                            <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">
                                                                                {time}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-slate-50 p-4 rounded-lg">
                                                            <h5 className="text-sm font-medium text-slate-700 mb-2">Team Distribution</h5>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <span className="text-sm text-slate-600">Timezones:</span>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {analysis.team_analysis.project_fit.schedule_assessment?.timezone_distribution?.map((tz, i) => (
                                                                            <Badge key={i} variant="outline" className="border-blue-300 text-blue-700">
                                                                                {tz}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm text-slate-600">Schedule Flexibility:</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-lg font-bold ${getScoreColor(analysis.team_analysis.project_fit.schedule_assessment?.flexibility_score || 0)}`}>
                                                                            {analysis.team_analysis.project_fit.schedule_assessment?.flexibility_score || 0}%
                                                                        </span>
                                                                        <Progress 
                                                                            value={analysis.team_analysis.project_fit.schedule_assessment?.flexibility_score || 0} 
                                                                            className="flex-1"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Team Culture and Values */}
                                            {analysis.team_analysis.project_fit?.charter_alignment?.detailed_assessment && (
                                                <div className="mt-6">
                                                    <h4 className="font-semibold mb-4">Team Culture & Values</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="bg-slate-50 p-4 rounded-lg">
                                                            <h5 className="text-sm font-medium text-slate-700 mb-2">Shared Values</h5>
                                                            <div className="flex flex-wrap gap-1">
                                                                {analysis.team_analysis.project_fit.charter_alignment.detailed_assessment?.shared_values?.map((value, i) => (
                                                                    <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">
                                                                        {value}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="bg-slate-50 p-4 rounded-lg">
                                                            <h5 className="text-sm font-medium text-slate-700 mb-2">Potential Challenges</h5>
                                                            <div className="flex flex-wrap gap-1">
                                                                {analysis.team_analysis.project_fit.charter_alignment.detailed_assessment?.potential_conflicts?.map((conflict, i) => (
                                                                    <Badge key={i} variant="outline" className="border-orange-300 text-orange-700">
                                                                        {conflict}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="col-span-1 md:col-span-2 bg-slate-50 p-4 rounded-lg">
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <h5 className="text-sm font-medium text-slate-700 mb-1">Team Culture</h5>
                                                                    <p className="text-sm text-slate-600">
                                                                        {analysis.team_analysis.project_fit.charter_alignment.detailed_assessment?.team_culture}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-sm font-medium text-slate-700 mb-1">Decision Making</h5>
                                                                    <p className="text-sm text-slate-600">
                                                                        {analysis.team_analysis.project_fit.charter_alignment.detailed_assessment?.decision_making}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div>
                                        <h4 className="font-semibold mb-2">
                                            Improvement Recommendations
                                        </h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            {analysis.team_analysis.recommendations.map(
                                                (rec, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-start gap-2"
                                                    >
                                                        <span className="text-blue-600 mt-0.5">
                                                            •
                                                        </span>
                                                        {rec}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Member detailed analysis */}
                            <div className="mt-6">
                                <h4 className="font-semibold mb-4">Member Detailed Analysis</h4>
                                {analysis.member_analyses.map((member, index) => (
                                    <div key={member.member_email} className="mb-4 bg-white rounded-lg border p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h5 className="font-medium">{member.member_email}</h5>
                                                <Badge variant="outline" className="mt-1">
                                                    {member.role_suggestion}
                                                </Badge>
                                            </div>
                                            <span className={`text-lg font-bold ${getScoreColor(member.detailed_analysis?.technical_proficiency?.score || 0)}`}>
                                                {member.detailed_analysis?.technical_proficiency?.score || 0}%
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <h6 className="text-sm font-medium text-slate-700 mb-2">Technical Proficiency</h6>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-sm text-green-600">Strengths:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {member.detailed_analysis?.technical_proficiency?.strengths?.map((strength, i) => (
                                                                <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">
                                                                    {strength}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-orange-600">Areas for Improvement:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {member.detailed_analysis?.technical_proficiency?.areas_for_improvement?.map((area, i) => (
                                                                <Badge key={i} variant="outline" className="border-orange-300 text-orange-700">
                                                                    {area}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h6 className="text-sm font-medium text-slate-700 mb-2">Collaboration Style</h6>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-sm text-slate-600">Preferred Methods:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {member.detailed_analysis?.collaboration_style?.preferred_methods?.map((method, i) => (
                                                                <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">
                                                                    {method}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-slate-600">Communication:</span>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            {member.detailed_analysis?.collaboration_style?.communication_frequency}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-span-1 md:col-span-2">
                                                <h6 className="text-sm font-medium text-slate-700 mb-2">Project Contribution</h6>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-sm text-slate-600">Primary Responsibilities:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {member.detailed_analysis?.project_contribution?.primary_responsibilities?.map((resp, i) => (
                                                                <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800">
                                                                    {resp}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-slate-600">Potential Impact:</span>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            {member.detailed_analysis?.project_contribution?.potential_impact}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-orange-600">Risk Factors:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {member.detailed_analysis?.project_contribution?.risk_factors?.map((risk, i) => (
                                                                <Badge key={i} variant="outline" className="border-orange-300 text-orange-700">
                                                                    {risk}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default OrganizationScoreCard;
