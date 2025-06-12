'use server'
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const testOpenAIConnection = async () => {
    try {
        console.log('Testing OpenAI API connection...');
        
        // Test with a simple request
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: "Say 'Connection test successful'" }
            ],
            max_tokens: 10,
            temperature: 0
        });
        
        console.log('OpenAI API connection successful!');
        return { 
            success: true, 
            message: 'OpenAI API connection successful!',
            response: response.choices[0].message.content 
        };
    } catch (error) {
        console.error('OpenAI API connection failed:', error);
        
        let errorMessage = 'Unknown error';
        
        if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timeout - check your internet connection';
        } else if (error.status === 401) {
            errorMessage = 'Invalid API key - check your .env.local file';
        } else if (error.status === 429) {
            errorMessage = 'Rate limit exceeded - try again later';
        } else if (error.status === 500) {
            errorMessage = 'OpenAI server error - try again later';
        } else {
            errorMessage = error.message || 'Connection failed';
        }
        
        return { 
            success: false, 
            message: errorMessage,
            error: error.message 
        };
    }
}; 