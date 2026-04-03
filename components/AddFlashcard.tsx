'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type AddFlashcardProps = {
  setId: string
}

export default function AddFlashcard({ setId }: AddFlashcardProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!front.trim() || !back.trim()) {
      setMessage('Please fill in both the front and back.')
      return
    }

    if (!user) {
      setMessage('Please sign in before saving a flashcard.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('flashcards').insert([
      {
        front: front.trim(),
        back: back.trim(),
        set_id: setId,
        user_id: user.id,
      },
    ])

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Flashcard saved successfully.')
      setFront('')
      setBack('')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!userLoading && !user && (
        <p className="text-sm text-red-600">Please sign in before saving flashcards.</p>
      )}

      <div>
        <label htmlFor="front" className="mb-2 block text-sm font-medium">
          Front
        </label>
        <textarea
          id="front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Enter the front of the flashcard"
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      <div>
        <label htmlFor="back" className="mb-2 block text-sm font-medium">
          Back
        </label>
        <textarea
          id="back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Enter the back of the flashcard"
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      <button
        type="submit"
        disabled={loading || userLoading || !user}
        className="w-full rounded-lg bg-black px-4 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Flashcard'}
      </button>

      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  )
}
