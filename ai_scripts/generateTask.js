'use server'
// HAS TO HAVE USE SERVER!!! OTHERWISE NOT WORKING
// because openai blocks openai api key if used on client side to prevent leaking
const apiRequest = require("./apiRequest");

const responseFormat = {
    "type": "json_schema",
    "json_schema": {
        "name": "task_generation",
        "strict": true,
        "schema": {
            "type": "object",
            "properties": {
                "stages": {
                    "type": "array",
                    "description": "A list of stages, each containing a list of tasks.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "stage_name": {
                                "type": "string",
                                "description": "The name of the stage."
                            },
                            "tasks": {
                                "type": "array",
                                "description": "A list of tasks associated with this stage.",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "task_name": {
                                            "type": "string",
                                            "description": "The name of the task."
                                        },
                                        "task_description": {
                                            "type": "string",
                                        },
                                        "assigned_user": {
                                            "type": "string",
                                            "description": "The user to whom the task is assigned."
                                        }
                                    },
                                    "required": [
                                        "task_name",
                                        "task_description",
                                        "assigned_user"
                                    ],
                                    "additionalProperties": false
                                }
                            }
                        },
                        "required": [
                            "stage_name",
                            "tasks"
                        ],
                        "additionalProperties": false
                    }
                }
            },
            "required": [
                "stages"
            ],
            "additionalProperties": false
        },
        "strict": true
    }
};


export const generateTask = async (questions, userResponses, charterQuestions, teamCharterResponses) => {
    const context = `Come up with a project road map with various levels, each with detailed actionable steps for the sub-goal. Based on each user's onboarding info, assign each task a user's email based on their fields of interests and skills in each area that works the best.`;

    if (!userResponses || userResponses.length === 0) {
        throw new Error('There are no users to assign tasks to.');
    }
    if (!teamCharterResponses || teamCharterResponses.length === 0) {
        throw new Error('The team charter is empty.');
    }
    const input = `User onboarding project questions: ${questions}. Users' responses: ${userResponses}. Team Charter Questions: ${charterQuestions}. Team Charter Responses: ${teamCharterResponses}`;
    return await apiRequest({ context, responseFormat, input });
}