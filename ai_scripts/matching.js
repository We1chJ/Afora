"use server";
// HAS TO HAVE USE SERVER!!! OTHERWISE NOT WORKING
// because openai blocks openai api key if used on client side to prevent leaking
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
                    description: "The size that each group should contain.",
                },
                groups: {
                    type: "array",
                    description: "List of groups created from users.",
                    items: {
                        type: "array",
                        description: "List of user IDs in each group.",
                        items: {
                            type: "string",
                        },
                    },
                },
            },
            required: ["group_size", "groups"],
            additionalProperties: false,
        },
    },
};

export const matching = async (teamSize, questions, input) => {
    const context = `You need group the users into groups of size ${teamSize}. Given the user onboarding survey response in the following format and order: ${questions}, put users with similar background and skill level together.`;

    teamSize = Number(teamSize);
    if (isNaN(teamSize) || teamSize <= 0) {
        throw new Error("Team size must be a valid positive number");
    }
    if (!input || input.length === 0) {
        throw new Error("There are no members to be matched.");
    }
    input = input.join(" ");
    return await apiRequest({ context, responseFormat, input, functionName: "matching" });
};
