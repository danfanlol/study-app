'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type RenameSetFormProps = {
  currentName: string
  itemId: string
  itemLabel: string
  tableName: 'flashcard_sets' | 'problem_sets'
  onRename: (nextName: string) => void
  variant?: 'inline' | 'header'
}

export default function RenameSetForm({
  currentName,
  itemId,
  itemLabel,
  tableName,
  onRename,
  variant = 'inline',
}: RenameSetFormProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      setMessage(`Please enter a ${itemLabel} name.`)
      return
    }

    if (!user) {
      setMessage(`Please sign in before renaming this ${itemLabel}.`)
      return
    }

    if (trimmedName === currentName) {
      setIsEditing(false)
      setMessage('')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase
      .from(tableName)
      .update({ name: trimmedName })
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (error) {
      setMessage(`Error renaming ${itemLabel}: ${error.message}`)
      setLoading(false)
      return
    }

    onRename(trimmedName)
    setIsEditing(false)
    setMessage(`${itemLabel[0].toUpperCase()}${itemLabel.slice(1)} renamed.`)
    setLoading(false)
  }

  function handleStartEditing() {
    setName(currentName)
    setMessage('')
    setIsEditing(true)
  }

  function handleCancel() {
    setName(currentName)
    setMessage('')
    setIsEditing(false)
  }

  const isHeader = variant === 'header'

  if (!isEditing) {
    return (
      <div className={isHeader ? 'space-y-2' : 'space-y-2 text-right'}>
        <button
          type="button"
          onClick={handleStartEditing}
          disabled={loading || userLoading || !user}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isHeader
              ? 'bg-gray-200 text-black hover:bg-gray-300'
              : 'border border-gray-300 bg-white text-black hover:bg-gray-50'
          }`}
        >
          Edit Name
        </button>

        {message && <p className="text-sm text-gray-700">{message}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={isHeader ? 'space-y-3' : 'space-y-2'}>
      <div>
        <label htmlFor={`${tableName}-${itemId}-rename`} className="sr-only">
          Rename {itemLabel}
        </label>
        <input
          id={`${tableName}-${itemId}-rename`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={`Enter a ${itemLabel} name`}
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className={`flex gap-2 ${isHeader ? 'justify-start' : 'justify-end'}`}>
        <button
          type="submit"
          disabled={loading || userLoading}
          className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  )
}
