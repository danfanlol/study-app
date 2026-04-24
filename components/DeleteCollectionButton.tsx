'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type DeleteCollectionButtonProps = {
  collectionId: string
  collectionName: string
  onDelete: (id: string) => void
}

export default function DeleteCollectionButton({
  collectionId,
  collectionName,
  onDelete,
}: DeleteCollectionButtonProps) {
  const { user } = useSupabaseUser()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete the collection "${collectionName}"?`
    )

    if (!confirmed) return

    if (!user) {
      setErrorMessage('Please sign in before deleting a collection.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    // Members are cascade-deleted via FK constraint on flashcard_set_collection_members
    const { error } = await supabase
      .from('flashcard_set_collections')
      .delete()
      .eq('id', collectionId)
      .eq('user_id', user.id)

    if (error) {
      setErrorMessage(`Error deleting collection: ${error.message}`)
    } else {
      onDelete(collectionId)
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
