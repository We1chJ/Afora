'use client'

import Link from 'next/link'
import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const SimpleTestPage = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test Page</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Mock Organization Test</CardTitle>
            <CardDescription>
              Virtual organization for testing team score functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This is a mock organization for testing Afora's team score functionality. It contains simulated organization data, projects, and member information.
            </p>
            <div className="space-y-2">
              <p><strong>Organization Name:</strong> Test Organization</p>
              <p><strong>Organization ID:</strong> mock-org-123</p>
              <p><strong>Description:</strong> This is a mock organization for testing group score functionality</p>
            </div>
            <div className="flex space-x-2">
              <Link href="/org/mock-org-123">
                <Button>
                  Visit Mock Organization
                </Button>
              </Link>
              <Link href="/org/mock-org-123/proj/proj-1">
                <Button variant="outline">
                  View Project 1
                </Button>
              </Link>
              <Link href="/org/mock-org-123/proj/proj-2">
                <Button variant="outline">
                  View Project 2
                </Button>
              </Link>
              <Link href="/org/mock-org-123/proj/proj-1/stage/stage-1">
                <Button variant="outline">
                  Task Pool Demo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Mock Data Overview</CardTitle>
            <CardDescription>
              Test data included in the mock organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Member List:</h4>
              <ul className="text-sm space-y-1">
                <li>• alice@test.com (Frontend Developer)</li>
                <li>• bob@test.com (Backend Developer)</li>
                <li>• charlie@test.com (Project Manager)</li>
                <li>• david@test.com (Quality Assurance)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Project List:</h4>
              <ul className="text-sm space-y-1">
                <li>• Frontend Development Project</li>
                <li>• Backend Architecture Project</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Features:</h4>
              <ul className="text-sm space-y-1">
                <li>• ✅ Team score functionality</li>
                <li>• ✅ Project management</li>
                <li>• ✅ Stage management</li>
                <li>• ✅ Team charter</li>
                <li>• ✅ Task pool with assign/complete</li>
                <li>• ✅ Leaderboard and scoring</li>
                <li>• ✅ Deadline tracking</li>
                <li>• ❌ Task generation (disabled in mock mode)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>🚀 Start Testing</CardTitle>
            <CardDescription>
              Test functionality using mock organization data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The mock organization has been configured with complete test data. You can:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Visit the mock organization page to see the overall structure</li>
              <li>Test team score functionality in the "Team Score" tab</li>
              <li>View and edit project details</li>
              <li>Manage project stages and progress</li>
              <li>Edit team charter</li>
              <li>Try the task pool system - assign, complete, and track tasks</li>
              <li>View the leaderboard to see point rankings</li>
              <li>Test task deadline and reassignment features</li>
            </ol>
            <div className="mt-4">
              <Link href="/org/mock-org-123">
                <Button size="lg">
                  🧪 Start Testing Mock Organization
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SimpleTestPage 