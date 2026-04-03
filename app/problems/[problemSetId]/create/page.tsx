'use client'

import { use } from 'react'
import Link from 'next/link'
import AddProblem from '@/components/AddProblem'

type CreateProblemPageProps = {
  params: Promise<{
    problemSetId: string
  }>
}

export default function CreateProblemPage({ params }: CreateProblemPageProps) {
  const { problemSetId } = use(params)

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href={`/problems/${problemSetId}`}
          className="mb-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Back to Problem Set
        </Link>

        <h1 className="mb-6 text-3xl font-bold">Save a Problem</h1>

        <AddProblem problemSetId={problemSetId} />
      </div>
    </main>
  )
}
