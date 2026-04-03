'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type DeleteFlashcardButtonProps = {
  flashcardId: string
  onDelete: (id: string) => void
}

export default function DeleteFlashcardButton({
  flashcardId,
  onDelete,
}: DeleteFlashcardButtonProps) {
  const { user } = useSupabaseUser()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this flashcard?'
    )

    if (!confirmed) return

    if (!user) {
      setErrorMessage('Please sign in before deleting a flashcard.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', flashcardId)
      .eq('user_id', user.id)

    if (error) {
      setErrorMessage(`Error deleting flashcard: ${error.message}`)
    } else {
      onDelete(flashcardId)
    }

    setLoading(false)
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  )
}
