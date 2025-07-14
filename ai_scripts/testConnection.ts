import OpenAI from 'openai';

export interface TestConnectionResult {
    success: boolean;
    response?: string;
    message?: string;
}

export async function testOpenAIConnection(): Promise<TestConnectionResult> {
    try {
        const openai = new OpenAI({
            apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Hello! This is a test connection." }],
        });

        if (response.choices && response.choices[0]?.message?.content) {
            return {
                success: true,
                response: response.choices[0].message.content
            };
        } else {
            return {
                success: false,
                message: "No response received from OpenAI"
            };
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Unknown error occurred"
        };
    }
} 