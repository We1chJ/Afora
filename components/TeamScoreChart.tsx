'use client'
import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamCompatibilityAnalysis } from '@/types/types'

interface TeamScoreChartProps {
  analysis: TeamCompatibilityAnalysis;
}

const TeamScoreChart = ({ analysis }: TeamScoreChartProps) => {
  // Prepare data for pie chart - based on overall score
  const pieData = [
    { name: 'Compatibility', value: analysis.overall_score, fill: '#8884d8' },
    { name: 'Room for Improvement', value: 100 - analysis.overall_score, fill: '#e5e5e5' }
  ];

  // Prepare data for bar chart - each member's score
  const barData = analysis.member_analyses.map((member, index) => ({
    name: member.member_email.split('@')[0], // Only show email prefix
    score: member.compatibility_score,
    role: member.role_suggestion
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // green
    if (score >= 80) return '#3B82F6'; // blue
    if (score >= 70) return '#F59E0B'; // yellow
    if (score >= 60) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  return (
    <div className="space-y-6">
      {/* Overall score pie chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Overall Compatibility</CardTitle>
          <CardDescription>Display team's overall compatibility score</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-4">
            <div className={`text-4xl font-bold`} style={{ color: getScoreColor(analysis.overall_score) }}>
              {analysis.overall_score}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Compatibility</p>
          </div>
        </CardContent>
      </Card>

      {/* Member score bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Member Compatibility Comparison</CardTitle>
          <CardDescription>Comparison of each member's compatibility score with the team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} pts`,
                    `Compatibility Score`
                  ]}
                  labelFormatter={(label: string, payload: any[]) => {
                    if (payload && payload[0]) {
                      return `${payload[0].payload.name} (${payload[0].payload.role})`;
                    }
                    return label;
                  }}
                />
                <Bar 
                  dataKey="score" 
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                >
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getScoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Skills distribution chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Skills Distribution</CardTitle>
          <CardDescription>Distribution of core skills among team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.member_analyses.map((member, index) => (
              <div key={member.member_email} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{member.member_email.split('@')[0]}</span>
                  <span className="text-xs text-muted-foreground">{member.role_suggestion}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {member.skills.slice(0, 5).map((skill, skillIndex) => (
                    <span 
                      key={skill}
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ 
                        backgroundColor: COLORS[skillIndex % COLORS.length] + '20',
                        color: COLORS[skillIndex % COLORS.length]
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamScoreChart; 