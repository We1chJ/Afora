import MockGroupScoreTest from '@/components/MockGroupScoreTest'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Group Score Function Test',
  description: 'Test team compatibility analysis functionality using mock data',
}

export default function TestGroupScorePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MockGroupScoreTest />
    </div>
  )
} 