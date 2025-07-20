import { NextRequest, NextResponse } from 'next/server';
import { matching } from '@/ai_scripts/matching';

export async function POST(request: NextRequest) {
    try {
        console.log("=== API route /api/matching called ===");
        
        // 验证请求Content-Type
        const contentType = request.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            return NextResponse.json(
                { error: "请求必须是JSON格式" },
                { status: 400 }
            );
        }

        // 解析并验证输入数据
        const body = await request.json();
        const { teamSize, questions, input, totalMembers } = body;

        // 验证必需字段
        if (!teamSize || !questions || !input || !totalMembers) {
            return NextResponse.json(
                { error: "缺少必需的参数" },
                { status: 400 }
            );
        }

        // 验证数据类型
        if (typeof teamSize !== 'string' && typeof teamSize !== 'number') {
            return NextResponse.json(
                { error: "teamSize必须是数字或字符串" },
                { status: 400 }
            );
        }

        if (!Array.isArray(questions)) {
            return NextResponse.json(
                { error: "questions必须是数组" },
                { status: 400 }
            );
        }

        if (!Array.isArray(input)) {
            return NextResponse.json(
                { error: "input必须是数组" },
                { status: 400 }
            );
        }

        if (typeof totalMembers !== 'number') {
            return NextResponse.json(
                { error: "totalMembers必须是数字" },
                { status: 400 }
            );
        }
        
        console.log("🔍 API route - teamSize:", teamSize);
        console.log("🔍 API route - questions:", questions);
        console.log("🔍 API route - input:", input);
        console.log("🔍 API route - totalMembers:", totalMembers);
        
        const result = await matching(teamSize, questions, input, totalMembers);
        
        // 验证返回结果
        if (!result || typeof result !== 'object') {
            throw new Error("匹配算法返回了无效的结果");
        }

        if (!Array.isArray(result.groups)) {
            throw new Error("匹配算法返回的groups不是数组");
        }
        
        console.log("🔍 API route - result:", result);
        
        return NextResponse.json(result);
    } catch (error) {
        console.error("❌ API route error:", error);
        
        // 根据错误类型返回不同的状态码
        if ((error as Error).message.includes("无效") || 
            (error as Error).message.includes("必须")) {
            return NextResponse.json(
                { error: (error as Error).message },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { error: "服务器内部错误：" + (error as Error).message },
            { status: 500 }
        );
    }
} 