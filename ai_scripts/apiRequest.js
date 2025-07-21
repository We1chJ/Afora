console.log("=== apiRequest.js loaded ===");

const dotenv = require("dotenv");
const OpenAI = require("openai");
// Load environment variables from .env.local
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Get the API key from the environment
});

const apiRequest = async ({ context, responseFormat, input }) => {
    console.log("=== apiRequest.js apiRequest() called ===");
    console.log("🔍 apiRequest.js - context:", context);
    console.log("🔍 apiRequest.js - responseFormat:", responseFormat);
    console.log("🔍 apiRequest.js - input:", input);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

    try {
        const response = await openai.chat.completions.create(
            {
                model: "gpt-4o-mini-2024-07-18",
                messages: [
                    { 
                        role: "system", 
                        content: `${context}\n\nYou MUST respond with a JSON data object in this exact format:\n\n{
  "group_size": 4,
  "groups": [
    ["email1@example.com", "email2@example.com", "email3@example.com", "email4@example.com"]
  ]
}\n\nDo not include any explanations, schemas, or text outside the JSON data object.` 
                    },
                    { 
                        role: "user", 
                        content: `Based on the following user data, generate one team and return it as a JSON object: ${input}` 
                    }
                ],
                response_format: { type: "json_object" },
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

        console.log("🔍 apiRequest.js - 完整OpenAI响应:", JSON.stringify(response, null, 2));
        console.log("🔍 apiRequest.js - response.choices:", response.choices);
        console.log("🔍 apiRequest.js - response.choices[0]:", response.choices[0]);
        console.log("🔍 apiRequest.js - response.choices[0].message:", response.choices[0].message);

        const content = response.choices[0].message.content;

        if (!content) {
            throw new Error("No content returned from OpenAI.");
        }

        try {
            const parsed = JSON.parse(content);
            console.log("🔍 apiRequest.js - parsed result:", parsed);
            return parsed;
        } catch (parseError) {
            console.error("❌ JSON parse error:", parseError);
            console.error("📦 Returned raw string:", content);
            throw new Error("Invalid JSON returned by OpenAI.");
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
