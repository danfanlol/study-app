'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type ShuffleProblemsButtonProps = {
  problemSetId: string
}

export default function ShuffleProblemsButton({
  problemSetId,
}: ShuffleProblemsButtonProps) {
  const router = useRouter()
  const { user, loading: userLoading } = useSupabaseUser()
  const userId = user?.id ?? null
  const [problemIds, setProblemIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProblemIds() {
      if (!userId) {
        setProblemIds([])
        setLoading(false)
        return
      }

      setLoading(true)

      const { data, error } = await supabase
        .from('problems')
        .select('id')
        .eq('problem_set_id', problemSetId)
        .eq('user_id', userId)

      if (error) {
        setProblemIds([])
      } else {
        setProblemIds((data || []).map((problem) => problem.id))
      }

      setLoading(false)
    }

    loadProblemIds()
  }, [problemSetId, userId])

  function startShuffle() {
    if (problemIds.length === 0) {
      return
    }

    sessionStorage.removeItem(`shuffle_session_${problemSetId}`)
    const randomProblemId = problemIds[Math.floor(Math.random() * problemIds.length)]
    router.push(`/problems/${problemSetId}/shuffle/${randomProblemId}`)
  }

  return (
    <button
      type="button"
      onClick={startShuffle}
      disabled={userLoading || loading || problemIds.length === 0}
      className="block w-full rounded-lg bg-amber-400 px-4 py-4 text-center text-base font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-200 disabled:text-gray-600"
    >
      {userLoading || loading
        ? 'Loading Shuffle...'
        : problemIds.length === 0
          ? 'SHUFFLE (Add a Problem First)'
          : 'SHUFFLE'}
    </button>
  )
}
