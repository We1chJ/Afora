'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Leaderboard from "@/components/Leaderboard";
import { UserScore } from "@/types/types";

function LeaderboardPage({ params: { id, projId } }: {
  params: {
    id: string;
    projId: string;
  }
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [userScores, setUserScores] = useState<UserScore[]>([]);
  const [projectTitle, setProjectTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    // Check if this is mock mode
    if (id === 'mock-org-123') {
      setIsMockMode(true);
      loadMockData();
    } else {
      loadRealData();
    }
  }, [id, projId]);

  const loadMockData = () => {
    // Mock leaderboard data
    const mockScores: UserScore[] = [
      {
        userId: 'alice',
        email: 'alice@test.com',
        totalPoints: 15,
        tasksCompleted: 15,
        tasksAssigned: 18,
        averageCompletionTime: 4.2,
        streak: 5
      },
      {
        userId: 'bob',
        email: 'bob@test.com',
        totalPoints: 12,
        tasksCompleted: 12,
        tasksAssigned: 15,
        averageCompletionTime: 6.1,
        streak: 3
      },
      {
        userId: 'charlie',
        email: 'charlie@test.com',
        totalPoints: 8,
        tasksCompleted: 8,
        tasksAssigned: 10,
        averageCompletionTime: 5.8,
        streak: 0
      },
      {
        userId: 'david',
        email: 'david@test.com',
        totalPoints: 6,
        tasksCompleted: 6,
        tasksAssigned: 8,
        averageCompletionTime: 7.3,
        streak: 2
      }
    ];

    const mockProjectTitles = {
      'proj-1': 'Frontend Development Project',
      'proj-2': 'Backend Architecture Project'
    };

    setUserScores(mockScores);
    setProjectTitle(mockProjectTitles[projId as keyof typeof mockProjectTitles] || 'Mock Project');
    setLoading(false);
  };

  const loadRealData = async () => {
    try {
      // TODO: Implement real data fetching from backend
      // Example API calls:
      // const projectResponse = await fetch(`/api/projects/${projId}`);
      // const project = await projectResponse.json();
      // setProjectTitle(project.title);
      
      // const scoresResponse = await fetch(`/api/projects/${projId}/leaderboard`);
      // const scores = await scoresResponse.json();
      // setUserScores(scores);
      
      // For now, show empty state
      setUserScores([]);
      setProjectTitle("Project Leaderboard");
      setLoading(false);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
      setLoading(false);
    }
  };

  if (!isSignedIn) return null;

  if (loading) {
    return <Skeleton className="w-full h-96" />;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Navigation */}
      <div className="mb-6">
        <Link href={`/org/${id}/proj/${projId}`}>
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Button>
        </Link>
      </div>

      {/* Leaderboard Component */}
      <Leaderboard
        projectId={projId}
        projectTitle={projectTitle}
        userScores={userScores}
        isMockMode={isMockMode}
      />
    </div>
  );
}

export default LeaderboardPage; 