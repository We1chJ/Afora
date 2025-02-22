const dotenv = require('dotenv');
const OpenAI = require('openai');
// Load environment variables from .env.local
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Get the API key from the environment
});

const apiRequest = async ({context, responseFormat, input}) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: context },
                {
                    role: "user",
                    content: input,
                },
            ],
            n: 1, // only return 1 output
            temperature: 0.5, // lower temperature ensures deterministic and consistent output logics
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            response_format: responseFormat
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching completion:", error);
    }
};

module.exports = apiRequest; // Exporting the function directly