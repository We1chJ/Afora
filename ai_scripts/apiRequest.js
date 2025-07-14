const dotenv = require("dotenv");
const OpenAI = require("openai");
// Load environment variables from .env.local
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Get the API key from the environment
});

const apiRequest = async ({ context, responseFormat, input }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

    try {
        const response = await openai.chat.completions.create(
            {
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: context },
                    { role: "user", content: input },
                ],
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "analyzeTeam",
                            description: "Analyze team compatibility",
                            parameters: responseFormat.schema,
                        },
                    },
                ],
                tool_choice: {
                    type: "function",
                    function: { name: "analyzeTeam" },
                },
                n: 1,
                temperature: 0.5,
                max_tokens: 1000,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            },
            {
                signal: controller.signal,
                timeout: 30000,
            }
        );

        clearTimeout(timeoutId);

        const functionCall = response.choices[0].message.tool_calls?.[0];
        const raw = functionCall?.function?.arguments;

        if (!raw) {
            throw new Error("No arguments returned from function call.");
        }

        try {
            return JSON.parse(raw);
        } catch (parseError) {
            console.error("❌ JSON parse error:", parseError);
            console.error("📦 Returned raw string:", raw);
            throw new Error("Invalid JSON returned by OpenAI function call.");
        }
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.code === "ETIMEDOUT" || error.name === "AbortError") {
            throw new Error(
                "OpenAI API request timed out. Please check your internet connection and try again."
            );
        }
        if (error.status === 401) {
            throw new Error("Invalid OpenAI API key. Please check your .env.local file.");
        }
        if (error.status === 429) {
            throw new Error("OpenAI API rate limit exceeded. Please try again later.");
        }

        console.error("❌ Error fetching completion:", error);
        throw error;
    }
};


module.exports = apiRequest; // Exporting the function directly
