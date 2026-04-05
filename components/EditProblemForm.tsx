'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import DeleteProblemButton from '@/components/DeleteProblemButton'

type EditProblemFormProps = {
  problemId: string
  problemSetId: string
  currentTitle: string
  currentExplanation: string | null
  onSave: (nextValues: { title: string; explanation: string | null }) => void
  onDelete?: () => void
}

export default function EditProblemForm({
  problemId,
  problemSetId,
  currentTitle,
  currentExplanation,
  onSave,
  onDelete,
}: EditProblemFormProps) {
  const router = useRouter()
  const { user, loading: userLoading } = useSupabaseUser()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(currentTitle)
  const [explanation, setExplanation] = useState(currentExplanation ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  function handleStartEditing() {
    setTitle(currentTitle)
    setExplanation(currentExplanation ?? '')
    setMessage('')
    setIsEditing(true)
  }

  function handleCancel() {
    setTitle(currentTitle)
    setExplanation(currentExplanation ?? '')
    setMessage('')
    setIsEditing(false)
  }

  function handleDelete() {
    setIsEditing(false)
    setMessage('')
    onDelete?.()
    router.push(`/problems/${problemSetId}`)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedExplanation = explanation.trim()

    if (!trimmedTitle) {
      setMessage('Please enter a title for this problem.')
      return
    }

    if (!user) {
      setMessage('Please sign in before editing this problem.')
      return
    }

    const nextExplanation = trimmedExplanation || null

    if (trimmedTitle === currentTitle && nextExplanation === currentExplanation) {
      setIsEditing(false)
      setMessage('')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from('problems')
      .update({
        title: trimmedTitle,
        explanation: nextExplanation,
      })
      .eq('id', problemId)
      .eq('problem_set_id', problemSetId)
      .eq('user_id', user.id)

    if (error) {
      setMessage(`Error updating problem: ${error.message}`)
      setLoading(false)
      return
    }

    onSave({
      title: trimmedTitle,
      explanation: nextExplanation,
    })
    setIsEditing(false)
    setMessage('Problem updated.')
    setLoading(false)
  }

  if (!isEditing) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleStartEditing}
          disabled={loading || userLoading || !user}
          className="rounded-lg bg-gray-200 px-4 py-3 font-medium text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Edit Problem
        </button>

        {message && <p className="text-sm text-gray-700">{message}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div>
        <label htmlFor={`problem-title-${problemId}`} className="mb-2 block text-sm font-medium">
          Title
        </label>
        <input
          id={`problem-title-${problemId}`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a title for this problem"
          className="w-full rounded-lg border bg-white p-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor={`problem-explanation-${problemId}`}
          className="mb-2 block text-sm font-medium"
        >
          Explanation
        </label>
        <textarea
          id={`problem-explanation-${problemId}`}
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
          placeholder="Optional explanation or notes"
          className="w-full rounded-lg border bg-white p-3 outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || userLoading}
          className="rounded-lg bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-lg bg-gray-200 px-4 py-3 font-medium text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="mb-3">
          <p className="font-medium text-red-700">Delete this problem</p>
          <p className="text-sm text-red-600">
            This removes the problem and all saved images for it.
          </p>
        </div>

        <DeleteProblemButton
          problemId={problemId}
          problemTitle={currentTitle}
          onDelete={handleDelete}
        />
      </div>

      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  )
}
