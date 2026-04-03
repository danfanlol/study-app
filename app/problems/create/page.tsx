'use client'

import Link from 'next/link'
import AddProblemSet from '@/components/AddProblemSet'

export default function CreateProblemSetPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href="/problems"
          className="mb-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Back to Problem Sets
        </Link>

        <h1 className="mb-6 text-3xl font-bold">Create a Problem Set</h1>

        <AddProblemSet />
      </div>
    </main>
  )
}
