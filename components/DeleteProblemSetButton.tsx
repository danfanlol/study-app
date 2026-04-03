'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

const PROBLEM_IMAGES_BUCKET = 'problem-images'

type DeleteProblemSetButtonProps = {
  problemSetId: string
  problemSetName: string
  onDelete: (id: string) => void
}

export default function DeleteProblemSetButton({
  problemSetId,
  problemSetName,
  onDelete,
}: DeleteProblemSetButtonProps) {
  const { user } = useSupabaseUser()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${problemSetName}" and all of its problems?`
    )

    if (!confirmed) return

    if (!user) {
      setErrorMessage('Please sign in before deleting a problem set.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    const { data: problems, error: problemsError } = await supabase
      .from('problems')
      .select('id')
      .eq('problem_set_id', problemSetId)
      .eq('user_id', user.id)

    if (problemsError) {
      setErrorMessage(`Error finding problems: ${problemsError.message}`)
      setLoading(false)
      return
    }

    const problemIds = (problems || []).map((problem) => problem.id)

    if (problemIds.length > 0) {
      const { data: imageRows, error: imageLookupError } = await supabase
        .from('problem_images')
        .select('storage_path')
        .in('problem_id', problemIds)
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
        .in('problem_id', problemIds)
        .eq('user_id', user.id)

      if (imageDeleteError) {
        setErrorMessage(`Error deleting image records: ${imageDeleteError.message}`)
        setLoading(false)
        return
      }

      const { error: problemDeleteError } = await supabase
        .from('problems')
        .delete()
        .eq('problem_set_id', problemSetId)
        .eq('user_id', user.id)

      if (problemDeleteError) {
        setErrorMessage(`Error deleting problems: ${problemDeleteError.message}`)
        setLoading(false)
        return
      }
    }

    const { error: problemSetDeleteError } = await supabase
      .from('problem_sets')
      .delete()
      .eq('id', problemSetId)
      .eq('user_id', user.id)

    if (problemSetDeleteError) {
      setErrorMessage(`Error deleting problem set: ${problemSetDeleteError.message}`)
    } else {
      onDelete(problemSetId)
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
