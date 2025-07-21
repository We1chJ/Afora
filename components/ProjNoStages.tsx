import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Organization, projQuestions } from "@/types/types";
import { createProject } from "@/actions/actions";
import { useRouter } from "next/navigation";

interface ProjNoStagesProps {
    id: string;
    projTitle: string;
    teamSize: string;
    setTeamSize: (size: string) => void;
    setProjTitle: (title: string) => void;
    isMockMode: boolean;
}

export function ProjNoStages({
    id,
    projTitle,
    teamSize,
    setTeamSize,
    setProjTitle,
    isMockMode,
}: ProjNoStagesProps) {
    const router = useRouter();

    return (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center space-y-6">
            <div className="text-gray-500">
                <h3 className="text-lg font-medium mb-2">开始一个新项目</h3>
                <p>输入团队大小，我们将为您匹配最合适的团队成员</p>
            </div>
            <div className="flex flex-col items-center gap-4">
                {!isMockMode ? (
                    <div className="w-full max-w-md space-y-4">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={projTitle}
                                onChange={(e) => setProjTitle(e.target.value)}
                                placeholder="项目名称"
                                className="flex-1 px-3 py-2 border rounded-md"
                            />
                            <input
                                type="number"
                                value={teamSize}
                                onChange={(e) => setTeamSize(e.target.value)}
                                placeholder="团队大小"
                                className="w-32 px-3 py-2 border rounded-md"
                                min="2"
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={async () => {
                                try {
                                    if (!projTitle.trim()) {
                                        toast.error("请输入项目名称");
                                        return;
                                    }
                                    if (!teamSize || Number(teamSize) < 2) {
                                        toast.error("团队大小必须大于等于2");
                                        return;
                                    }

                                    // 获取组织成员数据
                                    const orgDoc = await getDoc(doc(db, "organizations", id));
                                    const orgData = orgDoc?.data() as Organization;
                                    
                                    if (!orgData) {
                                        toast.error("未找到组织信息");
                                        return;
                                    }

                                    const memberList = orgData.members;
                                    if (memberList.length < Number(teamSize)) {
                                        toast.error(`组织成员数量(${memberList.length})小于团队大小(${teamSize})`);
                                        return;
                                    }
                                    
                                    // 获取每个成员的调查回答
                                    const userDataPromise = memberList.map(async (user) => {
                                        const userDoc = await getDoc(doc(db, "users", user));
                                        const userDocData = userDoc.data();
                                        const surveyResponse = userDocData?.onboardingSurveyResponse
                                            ? userDocData.onboardingSurveyResponse.join(",")
                                            : "";
                                        return `{${user}:${surveyResponse}}`;
                                    });

                                    const userData = await Promise.all(userDataPromise);

                                    // 调用匹配API
                                    const response = await fetch('/api/matching', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            teamSize: Number(teamSize),
                                            questions: projQuestions,
                                            input: userData,
                                            totalMembers: memberList.length
                                        })
                                    });

                                    if (!response.ok) {
                                        throw new Error(`匹配失败: ${response.status}`);
                                    }

                                    const result = await response.json();
                                    
                                    // 创建新项目
                                    const createResult = await createProject(
                                        id,
                                        projTitle,
                                        result.groups[0] // 使用第一个匹配的团队
                                    );

                                    if (createResult.success) {
                                        toast.success("项目创建成功！");
                                        router.refresh();
                                    } else {
                                        toast.error("项目创建失败：" + createResult.message);
                                    }
                                } catch (error) {
                                    console.error("团队生成错误:", error);
                                    toast.error("团队生成失败：" + (error as Error).message);
                                }
                            }}
                            disabled={!projTitle.trim() || !teamSize || Number(teamSize) < 2}
                        >
                            生成团队
                        </Button>
                    </div>
                ) : (
                    <Button disabled>
                        Mock Mode: Team generation disabled
                    </Button>
                )}
            </div>
        </div>
    );
} 