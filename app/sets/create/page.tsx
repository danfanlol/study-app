'use client'

import Link from 'next/link'
import AddSet from '@/components/AddSet'

export default function CreateSetPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href="/"
          className="mb-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Back to Home
        </Link>

        <h1 className="mb-6 text-3xl font-bold">Create a Flashcard Set</h1>

        <AddSet />
      </div>
    </main>
  )
}
