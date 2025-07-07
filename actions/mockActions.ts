"use server";

// Temporary mock actions for testing group score functionality, bypassing authentication issues

export async function createMockOrganization() {
    // Create mock organization data
    const mockOrgData = {
        id: "mock-org-123",
        title: "Test Organization",
        description:
            "This is a mock organization for testing group score functionality",
        admins: ["admin@test.com"],
        members: [
            "alice@test.com",
            "bob@test.com",
            "charlie@test.com",
            "david@test.com",
        ],
    };

    return { success: true, orgData: mockOrgData };
}

export async function getMockOrganizationMembersResponses(orgId: string) {
    // Return mock team member survey responses
    const mockResponses = [
        {
            email: "alice@test.com",
            responses: [
                "React,TypeScript,UI/UX Design,CSS,JavaScript",
                "Web Development,Frontend Development,Mobile Development",
                "Senior Frontend Developer,UI/UX Designer,Product Manager",
            ],
        },
        {
            email: "bob@test.com",
            responses: [
                "Node.js,PostgreSQL,Docker,AWS,System Architecture",
                "Backend Development,Cloud Computing,DevOps",
                "Backend Architect,DevOps Engineer,Technical Lead",
            ],
        },
        {
            email: "charlie@test.com",
            responses: [
                "Project Management,Scrum,Data Analysis,Business Analysis",
                "Product Management,Business Strategy,Team Leadership",
                "Project Manager,Product Manager,Business Analyst",
            ],
        },
        {
            email: "david@test.com",
            responses: [
                "Testing,Quality Assurance,Automation,Bug Tracking",
                "Software Testing,Quality Control,Process Improvement",
                "QA Engineer,Test Lead,Quality Manager",
            ],
        },
    ];

    return { success: true, data: mockResponses };
}

export async function createMockTeamProjects() {
    // Create some mock projects
    const mockProjects = [
        {
            id: "proj-1",
            title: "Frontend Development Project",
            members: ["alice@test.com", "bob@test.com"],
            orgId: "mock-org-123",
        },
        {
            id: "proj-2",
            title: "Backend Architecture Project",
            members: ["charlie@test.com", "david@test.com"],
            orgId: "mock-org-123",
        },
    ];

    return { success: true, projects: mockProjects };
}

// Simplified version function that temporarily bypasses authentication
export async function mockSetUserOnboardingSurvey(selectedTags: string[][]) {
    try {
        const formatted = selectedTags.map((tags) => tags.join(","));

        if (formatted.some((tag) => tag === "")) {
            throw new Error(
                "Please select at least one tag for each question!",
            );
        }

        console.log("Mock saving user survey:", formatted);
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}

export async function mockUpdateProjects(orgId: string, groups: string[][]) {
    try {
        console.log("Mock updating project groups:", { orgId, groups });

        // Simulate project creation
        const mockProjectsCreated = groups.map((group, index) => ({
            id: `mock-proj-${index + 1}`,
            title: `Test Project ${index + 1}`,
            members: group,
            orgId: orgId,
        }));

        return { success: true, projects: mockProjectsCreated };
    } catch (error) {
        console.error(error);
        return { success: false, message: (error as Error).message };
    }
}
