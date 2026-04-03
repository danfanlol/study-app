'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

const PROBLEM_IMAGES_BUCKET = 'problem-images'

type DeleteProblemButtonProps = {
  problemId: string
  problemTitle: string
  onDelete: (id: string) => void
}

export default function DeleteProblemButton({
  problemId,
  problemTitle,
  onDelete,
}: DeleteProblemButtonProps) {
  const { user } = useSupabaseUser()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${problemTitle}" and all of its images?`
    )

    if (!confirmed) return

    if (!user) {
      setErrorMessage('Please sign in before deleting a problem.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    const { data: imageRows, error: imageLookupError } = await supabase
      .from('problem_images')
      .select('storage_path')
      .eq('problem_id', problemId)
      .eq('user_id', user.id)

    if (imageLookupError) {
      setErrorMessage(`Error finding problem images: ${imageLookupError.message}`)
      setLoading(false)
      return
    }

    const storagePaths = (imageRows || []).map((row) => row.storage_path)

    if (storagePaths.length > 0) {
      const { error: storageDeleteError } = await supabase.storage
        .from(PROBLEM_IMAGES_BUCKET)
        .remove(storagePaths)

      if (storageDeleteError) {
        setErrorMessage(`Error deleting stored images: ${storageDeleteError.message}`)
        setLoading(false)
        return
      }
    }

    const { error: imageDeleteError } = await supabase
      .from('problem_images')
      .delete()
      .eq('problem_id', problemId)
      .eq('user_id', user.id)

    if (imageDeleteError) {
      setErrorMessage(`Error deleting image records: ${imageDeleteError.message}`)
      setLoading(false)
      return
    }

    const { error: problemDeleteError } = await supabase
      .from('problems')
      .delete()
      .eq('id', problemId)
      .eq('user_id', user.id)

    if (problemDeleteError) {
      setErrorMessage(`Error deleting problem: ${problemDeleteError.message}`)
    } else {
      onDelete(problemId)
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
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
