"use server"; // Required for server actions to safely call OpenAI

const apiRequest = require("./apiRequest");

const responseFormat = {
    type: "json_schema",
    json_schema: {
        name: "user_groups",
        schema: {
            type: "object",
            properties: {
                group_size: {
                    type: "number",
                    description: "Size of each team.",
                },
                groups: {
                    type: "array",
                    description: "List of groups (each group is a list of user IDs).",
                    items: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
            },
            required: ["group_size", "groups"],
            additionalProperties: false,
        },
    },
};

// 基于 onboarding survey 匹配队伍，优先相似背景和技能
export const matching = async (teamSize, questions, input, totalMembers) => {
    teamSize = Number(teamSize);
    if (!teamSize || teamSize <= 0) throw new Error("Invalid team size");
    if (!input?.length) throw new Error("No members to match");

    const context = `As an experienced HR manager and team builder, your goal is to form effective project teams of size ${teamSize} from ${totalMembers} users, based on their onboarding survey responses.

The survey questions are: ${questions}.

Please prioritize **skill and background complementarity** over similarity — that is, create teams where members bring different strengths and fill each other's gaps. Each team should ideally include:
- At least one member with leadership or communication strength
- A mix of experience levels (e.g. beginner + advanced)
- Complementary roles (e.g. tech + product + business oriented)`;

    const result = await apiRequest({
        context,
        responseFormat,
        input: input.join(" "),
    });

    // fallback: 只取前 teamSize 个成员邮箱
    if (!result?.groups?.length) {
        const fallbackGroup = input
            .slice(0, teamSize)
            .map((entry) => {
                const match = entry.match(/\{([^:]+):/);
                return match?.[1] ?? null;
            })
            .filter((id) => id && id.includes("@"));
        return { group_size: teamSize, groups: [fallbackGroup] };
    }

    return result;
};
