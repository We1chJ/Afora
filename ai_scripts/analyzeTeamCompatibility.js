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
                            detailed_analysis: {
                                type: "object",
                                description: "Detailed analysis of member's capabilities and fit",
                                properties: {
                                    technical_proficiency: {
                                        type: "object",
                                        properties: {
                                            score: {
                                                type: "number",
                                                description: "Technical proficiency score from 0-100",
                                                minimum: 0,
                                                maximum: 100
                                            },
                                            strengths: {
                                                type: "array",
                                                items: { type: "string" },
                                                description: "Technical strengths"
                                            },
                                            areas_for_improvement: {
                                                type: "array",
                                                items: { type: "string" },
                                                description: "Areas needing improvement"
                                            }
                                        },
                                        required: ["score", "strengths", "areas_for_improvement"],
                                        additionalProperties: false
                                    },
                                    collaboration_style: {
                                        type: "object",
                                        properties: {
                                            preferred_methods: {
                                                type: "array",
                                                items: { type: "string" },
                                                description: "Preferred collaboration methods"
                                            },
                                            communication_frequency: {
                                                type: "string",
                                                description: "Preferred communication frequency"
                                            },
                                            team_role: {
                                                type: "string",
                                                description: "Natural team role"
                                            }
                                        },
                                        required: ["preferred_methods", "communication_frequency", "team_role"],
                                        additionalProperties: false
                                    },
                                    project_contribution: {
                                        type: "object",
                                        properties: {
                                            primary_responsibilities: {
                                                type: "array",
                                                items: { type: "string" },
                                                description: "Primary project responsibilities"
                                            },
                                            potential_impact: {
                                                type: "string",
                                                description: "Potential impact on project"
                                            },
                                            risk_factors: {
                                                type: "array",
                                                items: { type: "string" },
                                                description: "Potential risk factors"
                                            }
                                        },
                                        required: ["primary_responsibilities", "potential_impact", "risk_factors"],
                                        additionalProperties: false
                                    }
                                },
                                required: ["technical_proficiency", "collaboration_style", "project_contribution"],
                                additionalProperties: false
                            }
                        },
                        required: [
                            "member_email",
                            "strengths",
                            "skills",
                            "interests",
                            "compatibility_score",
                            "role_suggestion",
                            "detailed_analysis"
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
                        project_fit: {
                            type: "object",
                            description: "Analysis of how well the team fits the project requirements",
                            properties: {
                                technical_alignment: {
                                    type: "number",
                                    description: "Score 0-100 indicating how well team's technical skills match project needs",
                                    minimum: 0,
                                    maximum: 100
                                },
                                schedule_compatibility: {
                                    type: "number",
                                    description: "Score 0-100 indicating how well team members' schedules align",
                                    minimum: 0,
                                    maximum: 100
                                },
                                interest_alignment: {
                                    type: "number",
                                    description: "Score 0-100 indicating how well team's interests align with project goals",
                                    minimum: 0,
                                    maximum: 100
                                },
                                charter_alignment: {
                                    type: "object",
                                    description: "Analysis of team charter alignment",
                                    properties: {
                                        vision_alignment: {
                                            type: "number",
                                            description: "Score 0-100 indicating how well team members align on project vision",
                                            minimum: 0,
                                            maximum: 100
                                        },
                                        values_compatibility: {
                                            type: "number",
                                            description: "Score 0-100 indicating how well team members' values and working styles align",
                                            minimum: 0,
                                            maximum: 100
                                        },
                                        key_findings: {
                                            type: "array",
                                            description: "Key observations from team charter analysis",
                                            items: {
                                                type: "string"
                                            }
                                        }
                                    },
                                    required: ["vision_alignment", "values_compatibility", "key_findings"],
                                    additionalProperties: false
                                },
                                comments: {
                                    type: "array",
                                    description: "Specific observations about project-team fit",
                                    items: {
                                        type: "string"
                                    }
                                }
                            },
                            required: ["technical_alignment", "schedule_compatibility", "interest_alignment", "charter_alignment", "comments"],
                            additionalProperties: false
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
                        "project_fit",
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
    teamCharterResponse
) => {
    const context = `
You are a professional team analyst responsible for analyzing team member compatibility and synergy.

Please analyze each team member's capabilities in detail based on their onboarding survey responses, team charter responses, and evaluate the overall team compatibility, with special focus on project requirements and goals.

Analysis Requirements:
1. Analyze each member's core skills, areas of interest, and potential contributions to the specific project
2. Evaluate complementarity and collaboration potential between members
3. Identify overall team strengths and potential weaknesses in relation to project needs
4. Assess schedule compatibility based on provided time slots
5. Evaluate technical skill alignment with project requirements
6. Analyze interest alignment with project goals
7. Analyze team charter alignment including shared vision and values
8. Provide a 0-100 team compatibility score
9. Provide specific and actionable team improvement recommendations

For each team member, provide detailed analysis in these areas:

Technical Proficiency:
- Technical proficiency score (0-100)
- Key technical strengths
- Areas needing improvement

Collaboration Style:
- Preferred collaboration methods
- Communication frequency preferences
- Natural team role

Project Contribution:
- Primary project responsibilities
- Potential impact on project success
- Risk factors to consider

Scoring Criteria:
- 90-100 points: Team members have highly complementary skills with excellent collaboration potential, strong project alignment, and shared vision
- 80-89 points: Good team configuration with strong collaboration foundation, good project fit, and aligned values
- 70-79 points: Balanced team with some room for improvement in project alignment or vision alignment
- 60-69 points: Team has obvious shortcomings requiring adjustments in skills, project fit, or team alignment
- Below 60 points: Team configuration has serious issues with project compatibility or team cohesion

Project-Specific Analysis:
- Technical Alignment: Evaluate how well the team's combined technical skills match project requirements
- Schedule Compatibility: Analyze how well team members' available time slots align
- Interest Alignment: Assess how well team members' interests and goals align with the project
- Charter Alignment: Evaluate how well team members align on vision, values, and working approaches

Please provide your analysis in English with specific, actionable recommendations.`;

    if (!memberResponses || memberResponses.length === 0) {
        throw new Error("No team member data available for analysis");
    }

    const input = `
Onboarding Survey Questions:
${onboardingQuestions.join("\n")}

Team Charter Response:
${teamCharterResponse || 'Not provided'}

Team Member Responses:
${memberResponses.map(response => {
    const [answers, timeSlots] = response.split('Time Slots:');
    return `
Member Responses:
${answers}

Available Time Slots:
${timeSlots || 'Not provided'}`
}).join("\n\n")}

Please conduct a comprehensive compatibility analysis for this team, paying special attention to:
1. Technical skill alignment with project requirements
2. Schedule compatibility based on provided time slots
3. Interest and goal alignment with the project
4. Team charter alignment and shared vision
5. Team dynamics and collaboration potential`;

    return await apiRequest({ context, responseFormat, input });
};
