'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import { ProblemSet } from '@/types/problemSet'
import DeleteProblemSetButton from '@/components/DeleteProblemSetButton'

type ProblemSetsListProps = {
  emptyMessage?: string
  mode?: 'browse' | 'delete'
}

export default function ProblemSetsList({
  emptyMessage = 'No problem sets found.',
  mode = 'browse',
}: ProblemSetsListProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const [problemSets, setProblemSets] = useState<ProblemSet[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadProblemSets() {
      if (!user) {
        setProblemSets([])
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('problem_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(`Error loading problem sets: ${error.message}`)
        setProblemSets([])
      } else {
        setProblemSets(data || [])
      }

      setLoading(false)
    }

    loadProblemSets()
  }, [user])

  if (userLoading || loading) {
    return <p>Loading problem sets...</p>
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>
  }

  if (!user) {
    return <p>Sign in to view your problem sets.</p>
  }

  if (problemSets.length === 0) {
    return <p>{emptyMessage}</p>
  }

  function handleRemoveDeletedProblemSet(id: string) {
    setProblemSets((prev) => prev.filter((problemSet) => problemSet.id !== id))
  }

  return (
    <div className="space-y-4">
      {problemSets.map((problemSet) => (
        mode === 'delete' ? (
          <div
            key={problemSet.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-lg font-semibold">{problemSet.name}</p>
            <DeleteProblemSetButton
              problemSetId={problemSet.id}
              problemSetName={problemSet.name}
              onDelete={handleRemoveDeletedProblemSet}
            />
          </div>
        ) : (
          <Link
            key={problemSet.id}
            href={`/problems/${problemSet.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:bg-gray-50"
          >
            <p className="text-lg font-semibold">{problemSet.name}</p>
          </Link>
        )
      ))}
    </div>
  )
}
