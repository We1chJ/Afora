import SimpleGroupScoreTest from '@/components/SimpleGroupScoreTest'
import  Metadata from 'next'

export const metadata: Metadata = {
  title: 'Group Score Simple Test',
  description: 'Direct test of team compatibility analysis functionality',
}

export default function SimpleTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleGroupScoreTest />
    </div>
  )
} 