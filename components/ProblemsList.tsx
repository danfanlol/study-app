'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import { Problem } from '@/types/problem'
import DeleteProblemButton from '@/components/DeleteProblemButton'

type ProblemsListProps = {
  problemSetId: string
  emptyMessage?: string
  mode?: 'browse' | 'delete'
}

export default function ProblemsList({
  problemSetId,
  emptyMessage = 'No problems found.',
  mode = 'browse',
}: ProblemsListProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadProblems() {
      if (!user) {
        setProblems([])
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('user_id', user.id)
        .eq('problem_set_id', problemSetId)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(`Error loading problems: ${error.message}`)
        setProblems([])
      } else {
        setProblems(data || [])
      }

      setLoading(false)
    }

    loadProblems()
  }, [problemSetId, user])

  if (userLoading || loading) {
    return <p>Loading problems...</p>
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>
  }

  if (!user) {
    return <p>Sign in to view your saved problems.</p>
  }

  if (problems.length === 0) {
    return <p>{emptyMessage}</p>
  }

  function handleRemoveDeletedProblem(id: string) {
    setProblems((prev) => prev.filter((problem) => problem.id !== id))
  }

  return (
    <div className="space-y-4">
      {problems.map((problem) => (
        mode === 'delete' ? (
          <div
            key={problem.id}
            className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-lg font-semibold">{problem.title}</p>
            </div>

            <DeleteProblemButton
              problemId={problem.id}
              problemTitle={problem.title}
              onDelete={handleRemoveDeletedProblem}
            />
          </div>
        ) : (
          <Link
            key={problem.id}
            href={`/problems/${problemSetId}/${problem.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:bg-gray-50"
          >
            <p className="text-lg font-semibold">{problem.title}</p>
          </Link>
        )
      ))}
    </div>
  )
}
