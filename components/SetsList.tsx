'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { FlashcardSet } from '@/types/flashcardSet'
import DeleteSetButton from '@/components/DeleteSetButton'
import RenameSetForm from '@/components/RenameSetForm'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type SetsListProps = {
  emptyMessage?: string
  mode?: 'browse' | 'delete'
}

export default function SetsList({
  emptyMessage = 'No flashcard sets found.',
  mode = 'browse',
}: SetsListProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const [sets, setSets] = useState<FlashcardSet[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function fetchSets() {
      if (!user) {
        setSets([])
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('flashcard_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(`Error loading flashcard sets: ${error.message}`)
        setSets([])
      } else {
        setSets(data || [])
      }

      setLoading(false)
    }

    fetchSets()
  }, [user])

  if (userLoading || loading) {
    return <p>Loading flashcard sets...</p>
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>
  }

  if (!user) {
    return <p>Sign in to view your flashcard sets.</p>
  }

  if (sets.length === 0) {
    return <p>{emptyMessage}</p>
  }

  function handleRemoveDeletedSet(id: string) {
    setSets((prev) => prev.filter((setItem) => setItem.id !== id))
  }

  function handleRenameSet(id: string, nextName: string) {
    setSets((prev) =>
      prev.map((setItem) =>
        setItem.id === id ? { ...setItem, name: nextName } : setItem
      )
    )
  }

  return (
    <div className="space-y-4">
      {sets.map((setItem) =>
        mode === 'delete' ? (
          <div
            key={setItem.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-lg font-semibold">{setItem.name}</p>
            <DeleteSetButton
              setId={setItem.id}
              setName={setItem.name}
              onDelete={handleRemoveDeletedSet}
            />
          </div>
        ) : (
          <div
            key={setItem.id}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <Link
              href={`/sets/${setItem.id}`}
              className="block min-w-0 flex-1 rounded-lg transition hover:text-blue-600"
            >
              <p className="text-lg font-semibold">{setItem.name}</p>
            </Link>

            <div className="sm:w-56">
              <RenameSetForm
                currentName={setItem.name}
                itemId={setItem.id}
                itemLabel="flashcard set"
                tableName="flashcard_sets"
                onRename={(nextName) => handleRenameSet(setItem.id, nextName)}
              />
            </div>
          </div>
        )
      )}
    </div>
  )
}
