'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

export default function AddProblemSet() {
  const { user, loading: userLoading } = useSupabaseUser()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setMessage('Please enter a problem set name.')
      return
    }

    if (!user) {
      setMessage('Please sign in before creating a problem set.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('problem_sets').insert([
      {
        user_id: user.id,
        name: name.trim(),
      },
    ])

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Problem set created successfully.')
      setName('')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!userLoading && !user && (
        <p className="text-sm text-red-600">Please sign in before creating a problem set.</p>
      )}

      <div>
        <label htmlFor="problem-set-name" className="mb-2 block text-sm font-medium">
          Problem Set Name
        </label>
        <input
          id="problem-set-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter a problem set name"
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || userLoading || !user}
        className="rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Problem Set'}
      </button>

      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  )
}
