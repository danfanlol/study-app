'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DeleteFlashcardButton from '@/components/DeleteFlashcardButton'
import { Flashcard } from '@/types/flashcard'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type ShowFlashcardsProps = {
  setId: string
}

export default function ShowFlashcards({ setId }: ShowFlashcardsProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const userId = user?.id ?? null
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadFlashcards() {
      if (!userId) {
        setFlashcards([])
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('set_id', setId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(`Error loading flashcards: ${error.message}`)
        setFlashcards([])
      } else {
        setFlashcards(data || [])
      }

      setLoading(false)
    }

    loadFlashcards()
  }, [setId, userId])

  function handleRemoveDeletedCard(id: string) {
    setFlashcards((prev) => prev.filter((card) => card.id !== id))
  }

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">All Flashcards</h2>

      {userLoading || loading ? (
        <p>Loading flashcards...</p>
      ) : !user ? (
        <p>Sign in to view flashcards in this set.</p>
      ) : errorMessage ? (
        <p>{errorMessage}</p>
      ) : flashcards.length === 0 ? (
        <p>No flashcards found in this set.</p>
      ) : (
        <div className="space-y-4">
          {flashcards.map((card) => (
            <div
              key={card.id}
              className="rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <p className="mb-2">
                <span className="font-semibold">Front:</span> {card.front}
              </p>
              <p>
                <span className="font-semibold">Back:</span> {card.back}
              </p>

              <DeleteFlashcardButton
                flashcardId={card.id}
                onDelete={handleRemoveDeletedCard}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
