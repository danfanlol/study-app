'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type DeleteSetButtonProps = {
  setId: string
  setName: string
  onDelete: (id: string) => void
}

export default function DeleteSetButton({
  setId,
  setName,
  onDelete,
}: DeleteSetButtonProps) {
  const { user } = useSupabaseUser()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${setName}" and all of its flashcards?`
    )

    if (!confirmed) return

    if (!user) {
      setErrorMessage('Please sign in before deleting a set.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    const { error: flashcardsError } = await supabase
      .from('flashcards')
      .delete()
      .eq('set_id', setId)
      .eq('user_id', user.id)

    if (flashcardsError) {
      setErrorMessage(`Error deleting flashcards: ${flashcardsError.message}`)
      setLoading(false)
      return
    }

    const { error: setError } = await supabase
      .from('flashcard_sets')
      .delete()
      .eq('id', setId)
      .eq('user_id', user.id)

    if (setError) {
      setErrorMessage(`Error deleting set: ${setError.message}`)
    } else {
      onDelete(setId)
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? 'Deleting...' : 'Delete'}
      </button>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
    </div>
  )
}
