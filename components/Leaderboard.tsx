'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserScore, ProjectLeaderboard } from "@/types/types";
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp,
  Clock,
  CheckCircle,
  Target,
  Flame
} from "lucide-react";

interface LeaderboardProps {
  projectId: string;
  projectTitle: string;
  userScores: UserScore[];
  isMockMode?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  projectId,
  projectTitle,
  userScores,
  isMockMode = false
}) => {
  const [sortedScores, setSortedScores] = useState<UserScore[]>([]);

  useEffect(() => {
    // Sort users by total points (descending)
    const sorted = [...userScores].sort((a, b) => b.totalPoints - a.totalPoints);
    setSortedScores(sorted);
  }, [userScores]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <div className="h-6 w-6 flex items-center justify-center text-gray-500 font-bold">{rank}</div>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "outline";
      default:
        return "outline";
    }
  };

  const getStreakDisplay = (streak: number) => {
    if (streak === 0) return null;
    return (
      <div className="flex items-center gap-1 text-orange-600">
        <Flame className="h-4 w-4" />
        <span className="text-sm font-semibold">{streak}</span>
      </div>
    );
  };

  const formatEmail = (email: string) => {
    return email.length > 20 ? email.substring(0, 20) + '...' : email;
  };

  const topPerformers = sortedScores.slice(0, 3);
  const otherPerformers = sortedScores.slice(3);

  // Calculate team stats
  const teamStats = {
    totalPoints: userScores.reduce((sum, user) => sum + user.totalPoints, 0),
    totalTasksCompleted: userScores.reduce((sum, user) => sum + user.tasksCompleted, 0),
    totalTasksAssigned: userScores.reduce((sum, user) => sum + user.tasksAssigned, 0),
    averageCompletionTime: userScores.length > 0 
      ? userScores.reduce((sum, user) => sum + user.averageCompletionTime, 0) / userScores.length 
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {projectTitle} Leaderboard
            {isMockMode && (
              <Badge variant="outline" className="ml-2">Mock Mode</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{teamStats.totalPoints}</div>
              <div className="text-sm text-gray-500">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{teamStats.totalTasksCompleted}</div>
              <div className="text-sm text-gray-500">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{teamStats.totalTasksAssigned}</div>
              <div className="text-sm text-gray-500">Tasks Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{teamStats.averageCompletionTime.toFixed(1)}h</div>
              <div className="text-sm text-gray-500">Avg. Completion</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="rankings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="space-y-4">
          {/* Top 3 Performers */}
          {topPerformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🏆 Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {topPerformers.map((user, index) => {
                    const rank = index + 1;
                    return (
                      <div key={user.userId} className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3">
                          {getRankIcon(rank)}
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formatEmail(user.email)}</span>
                            <Badge variant={getRankBadgeVariant(rank)}>#{rank}</Badge>
                            {getStreakDisplay(user.streak)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.tasksCompleted} tasks completed • {user.averageCompletionTime.toFixed(1)}h avg
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{user.totalPoints}</div>
                          <div className="text-sm text-gray-500">points</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Performers */}
          {otherPerformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Other Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {otherPerformers.map((user, index) => {
                    const rank = index + 4; // Starting from 4th place
                    return (
                      <div key={user.userId} className="flex items-center gap-4 p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center text-gray-500 font-bold">
                            {rank}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              {user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatEmail(user.email)}</span>
                            {getStreakDisplay(user.streak)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.tasksCompleted} completed • {user.tasksAssigned} assigned
                          </div>
                        </div>
                        
                        <div className="text-lg font-semibold text-blue-600">
                          {user.totalPoints}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {userScores.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-500 mb-2">No data yet</h3>
                <p className="text-gray-400">Complete some tasks to see the leaderboard!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Member</th>
                      <th className="text-center py-2">Points</th>
                      <th className="text-center py-2">Completed</th>
                      <th className="text-center py-2">Assigned</th>
                      <th className="text-center py-2">Avg Time</th>
                      <th className="text-center py-2">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScores.map((user, index) => (
                      <tr key={user.userId} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {user.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{formatEmail(user.email)}</span>
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <Badge variant="outline">{user.totalPoints}</Badge>
                        </td>
                        <td className="text-center py-3">
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {user.tasksCompleted}
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Target className="h-4 w-4 text-blue-500" />
                            {user.tasksAssigned}
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="h-4 w-4 text-purple-500" />
                            {user.averageCompletionTime.toFixed(1)}h
                          </div>
                        </td>
                        <td className="text-center py-3">
                          {user.streak > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                              {user.streak}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaderboard; 