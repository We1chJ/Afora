"use server";
// HAS TO HAVE USE SERVER!!! OTHERWISE NOT WORKING
// because openai blocks openai api key if used on client side to prevent leaking
const apiRequest = require("./apiRequest");

const responseFormat = {
    type: "json_schema",
    json_schema: {
        name: "team_compatibility_analysis",
        strict: true,
        schema: {
            type: "object",
            properties: {
                overall_score: {
                    type: "number",
                    description: "Overall team compatibility score from 0-100",
                    minimum: 0,
                    maximum: 100,
                },
                member_analyses: {
                    type: "array",
                    description: "Individual analysis for each team member",
                    items: {
                        type: "object",
                        properties: {
                            member_email: {
                                type: "string",
                                description: "Member's email address",
                            },
                            strengths: {
                                type: "array",
                                description: "Key strengths of this member",
                                items: {
                                    type: "string",
                                },
                            },
                            skills: {
                                type: "array",
                                description:
                                    "Technical and professional skills",
                                items: {
                                    type: "string",
                                },
                            },
                            interests: {
                                type: "array",
                                description: "Areas of interest",
                                items: {
                                    type: "string",
                                },
                            },
                            compatibility_score: {
                                type: "number",
                                description:
                                    "Individual compatibility score with team from 0-100",
                                minimum: 0,
                                maximum: 100,
                            },
                            role_suggestion: {
                                type: "string",
                                description:
                                    "Suggested role or position for this member in the team",
                            },
                        },
                        required: [
                            "member_email",
                            "strengths",
                            "skills",
                            "interests",
                            "compatibility_score",
                            "role_suggestion",
                        ],
                        additionalProperties: false,
                    },
                },
                team_analysis: {
                    type: "object",
                    properties: {
                        team_strengths: {
                            type: "array",
                            description: "Overall team strengths",
                            items: {
                                type: "string",
                            },
                        },
                        potential_gaps: {
                            type: "array",
                            description:
                                "Potential skill or knowledge gaps in the team",
                            items: {
                                type: "string",
                            },
                        },
                        collaboration_potential: {
                            type: "string",
                            description:
                                "Assessment of how well the team might collaborate",
                        },
                        recommendations: {
                            type: "array",
                            description:
                                "Recommendations for improving team effectiveness",
                            items: {
                                type: "string",
                            },
                        },
                    },
                    required: [
                        "team_strengths",
                        "potential_gaps",
                        "collaboration_potential",
                        "recommendations",
                    ],
                    additionalProperties: false,
                },
            },
            required: ["overall_score", "member_analyses", "team_analysis"],
            additionalProperties: false,
        },
    },
};

export const analyzeTeamCompatibility = async (
    onboardingQuestions,
    memberResponses,
) => {
    const context = `You are a professional team analyst responsible for analyzing team member compatibility and synergy.

Please analyze each team member's capabilities in detail based on their onboarding survey responses and evaluate the overall team compatibility.

Analysis Requirements:
1. Analyze each member's core skills, areas of interest, and potential contributions
2. Evaluate complementarity and collaboration potential between members
3. Identify overall team strengths and potential weaknesses
4. Provide a 0-100 team compatibility score
5. Provide specific and actionable team improvement recommendations

Scoring Criteria:
- 90-100 points: Team members have highly complementary skills with excellent collaboration potential
- 80-89 points: Good team configuration with strong collaboration foundation
- 70-79 points: Balanced team with some room for improvement
- 60-69 points: Team has obvious shortcomings requiring adjustments
- Below 60 points: Team configuration has serious issues

Please provide your analysis in English with specific, actionable recommendations.`;

    if (!memberResponses || memberResponses.length === 0) {
        throw new Error("No team member data available for analysis");
    }

    const input = `
Onboarding Survey Questions:
${onboardingQuestions.join("\n")}

Team Member Responses:
${memberResponses.join("\n\n")}

Please conduct a comprehensive compatibility analysis for this team.`;

    return await apiRequest({ context, responseFormat, input });
};
