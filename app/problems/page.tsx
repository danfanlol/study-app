'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProblemSetsList from '@/components/ProblemSetsList'

export default function ProblemsPage() {
  const [showDeleteProblemSets, setShowDeleteProblemSets] = useState(false)

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href="/"
          className="mb-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Back to Home
        </Link>

        <div className="mb-6 space-y-4">
          <h1 className="text-3xl font-bold">Your Problem Sets</h1>

          <Link
            href="/problems/create"
            className="block rounded-lg bg-black px-4 py-3 text-center font-medium text-white"
          >
            Create Problem Set
          </Link>

          <button
            type="button"
            onClick={() => setShowDeleteProblemSets((prev) => !prev)}
            className={`block w-full rounded-lg px-4 py-3 text-center font-medium transition ${
              showDeleteProblemSets
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-200 text-black hover:bg-gray-300'
            }`}
          >
            {showDeleteProblemSets ? 'Done Deleting' : 'Delete Problem Set'}
          </button>
        </div>

        <ProblemSetsList
          emptyMessage="No problem sets yet. Create your first one above."
          mode={showDeleteProblemSets ? 'delete' : 'browse'}
        />
      </div>
    </main>
  )
}
