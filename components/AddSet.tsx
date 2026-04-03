'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type AddSetProps = {
  onSetCreated?: () => void
}

export default function AddSet({ onSetCreated }: AddSetProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!name.trim()) {
      setMessage('Please enter a set name.')
      return
    }

    if (!user) {
      setMessage('Please sign in before creating a set.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('flashcard_sets').insert([
      {
        name: name.trim(),
        user_id: user.id,
      },
    ])

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Set created successfully.')
      setName('')
      onSetCreated?.()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!userLoading && !user && (
        <p className="text-sm text-red-600">Please sign in before creating a set.</p>
      )}

      <div>
        <label htmlFor="set-name" className="mb-2 block text-sm font-medium">
          Set Name
        </label>
        <input
          id="set-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a set name"
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || userLoading || !user}
        className="rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Set'}
      </button>

      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  )
}
