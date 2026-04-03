'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import { ProblemSet } from '@/types/problemSet'
import AddProblem from '@/components/AddProblem'
import ProblemsList from '@/components/ProblemsList'

type ProblemSetPageProps = {
  params: Promise<{
    problemSetId: string
  }>
}

export default function ProblemSetDetailPage({ params }: ProblemSetPageProps) {
  const { problemSetId } = use(params)
  const { user, loading: userLoading } = useSupabaseUser()
  const [problemSet, setProblemSet] = useState<ProblemSet | null>(null)
  const [showAddProblem, setShowAddProblem] = useState(false)
  const [showDeleteProblems, setShowDeleteProblems] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadProblemSet() {
      if (!user) {
        setProblemSet(null)
        setErrorMessage('Please sign in to view this problem set.')
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('problem_sets')
        .select('*')
        .eq('id', problemSetId)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        setProblemSet(null)
        setErrorMessage('We could not find this problem set for your account.')
      } else {
        setProblemSet(data)
      }

      setLoading(false)
    }

    loadProblemSet()
  }, [problemSetId, user])

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href="/problems"
          className="mb-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Back to Problem Sets
        </Link>

        {userLoading || loading ? (
          <p>Loading problem set...</p>
        ) : errorMessage ? (
          <p className="text-red-600">{errorMessage}</p>
        ) : problemSet ? (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold">{problemSet.name}</h1>

            <section>
              <div className="mb-6 space-y-4">
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProblem((prev) => !prev)
                      setShowDeleteProblems(false)
                    }}
                    className="block w-full rounded-lg bg-black px-4 py-4 text-center text-base font-medium text-white"
                  >
                    {showAddProblem ? 'Close' : 'Add Problem'}
                  </button>

                  {!showAddProblem && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteProblems((prev) => !prev)}
                      className={`block w-full rounded-lg px-4 py-4 text-center text-base font-medium transition ${
                        showDeleteProblems
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-gray-200 text-black hover:bg-gray-300'
                      }`}
                    >
                      {showDeleteProblems ? 'Done Deleting' : 'Delete Problem'}
                    </button>
                  )}
                </div>

                {!showAddProblem && (
                  <h2 className="text-2xl font-semibold">Saved Problems</h2>
                )}
              </div>

              {showAddProblem && (
                <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <h3 className="mb-4 text-xl font-semibold">Add a Problem</h3>
                  <AddProblem problemSetId={problemSet.id} />
                </div>
              )}

              {!showAddProblem && (
                <ProblemsList
                  problemSetId={problemSet.id}
                  emptyMessage="No problems yet. Add your first one above."
                  mode={showDeleteProblems ? 'delete' : 'browse'}
                />
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  )
}
