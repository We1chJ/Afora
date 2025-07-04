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
                                        "soft_deadline": {
                                            "type": "string",
                                            "description": "The first soft deadline for the task"
                                        },
                                        "hard_deadline": {
                                            "type": "string",
                                            "description": "The final hard deadline for the task"
                                        }
                                    },
                                    "required": [
                                        "task_name",
                                        "task_description",
                                        "soft_deadline",
                                        "hard_deadline"
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
    const today = new Date().toISOString().split('T')[0];
    const context = `Using titles without numbers like stage 1, come up with a project road map with various levels, each with detailed actionable steps for the sub-goal. Give each task a soft and hard deadline each in the format of YYYY-MM-DD as of today is ${today}`;
    if (!userResponses || userResponses.length === 0) {
        throw new Error('There are no users to assign tasks to.');
    }
    if (!teamCharterResponses || teamCharterResponses.length === 0) {
        throw new Error('The team charter is empty.');
    }
    const input = `Team Charter Questions: ${charterQuestions}. Team Charter Responses: ${teamCharterResponses}`;
    return await apiRequest({ context, responseFormat, input });
}