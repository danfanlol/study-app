'use client'

import Link from 'next/link'
import SetsDashboard from '@/components/SetsDashboard'

export default function SetsPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href="/"
          className="mb-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Back to Home
        </Link>

        <h1 className="mb-6 text-3xl font-bold">Your Flashcard Sets</h1>

        <SetsDashboard />
      </div>
    </main>
  )
}
