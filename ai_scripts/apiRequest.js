const dotenv = require('dotenv');
const OpenAI = require('openai');
// Load environment variables from .env.local
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Get the API key from the environment
});

const apiRequest = async ({context, responseFormat, input}) => {
    try {
        // Add timeout and retry logic
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
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
        }, {
            signal: controller.signal,
            timeout: 30000
        });
        
        clearTimeout(timeoutId);
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Error fetching completion:", error);
        
        // Return a more specific error message
        if (error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
            throw new Error('OpenAI API request timed out. Please check your internet connection and try again.');
        }
        if (error.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your .env.local file.');
        }
        if (error.status === 429) {
            throw new Error('OpenAI API rate limit exceeded. Please try again later.');
        }
        
        throw error;
    }
};

module.exports = apiRequest; // Exporting the function directly