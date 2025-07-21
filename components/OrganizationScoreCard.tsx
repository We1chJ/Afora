"use client";
import React, { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Users, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { analyzeTeamCompatibility } from "@/ai_scripts/analyzeTeamCompatibility";
import { appQuestions, TeamCompatibilityAnalysis } from "@/types/types";
import { getOrganizationMembersResponses } from "@/actions/actions";
import { getMockOrganizationMembersResponses } from "@/actions/mockActions";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import TeamScoreChart from "./TeamScoreChart";
import { OrganizationScoreCardProps } from "@/types/types";

const OrganizationScoreCard = ({
    orgId,
    members,
    projectFilter,
}: OrganizationScoreCardProps) => {
    const [analysis, setAnalysis] = useState<TeamCompatibilityAnalysis | null>(
        null,
    );
    const [isPending, startTransition] = useTransition();

    const handleAnalyzeTeam = async () => {
        startTransition(() => {
            (async () => {
                try {                    // Get user survey responses (use mock data if mockData is true)
                    const membersData = await getOrganizationMembersResponses(orgId);

                    if (
                        !membersData.success ||
                        !membersData.data ||
                        membersData.data.length === 0
                    ) {
                        toast.error("No team member survey responses found");

                        // If no data, use generated mock responses
                        const memberResponses: string[] = [];
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

                    const successMessage = "Team analysis completed!";
                    toast.success(successMessage);
                } catch (error) {
                    console.error("Analysis failed:", error);
                    const errorMessage = "Analysis failed";
                    toast.error(errorMessage);
                    // Fallback to mock data on error
                    setAnalysis(null);
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
