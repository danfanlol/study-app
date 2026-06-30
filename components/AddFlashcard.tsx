'use client'

import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type AddFlashcardProps = {
  setId: string
  collectionId?: string
}

export default function AddFlashcard({ setId, collectionId }: AddFlashcardProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState('')

  async function checkForDuplicate(frontText: string): Promise<string> {
    if (!collectionId || !user) return ''

    const { data: members } = await supabase
      .from('flashcard_set_collection_members')
      .select('set_id')
      .eq('collection_id', collectionId)
      .eq('user_id', user.id)

    const setIds = (members ?? []).map((m) => m.set_id)
    if (setIds.length === 0) return ''

    const { data: dupes } = await supabase
      .from('flashcards')
      .select('set_id')
      .in('set_id', setIds)
      .ilike('front', frontText)
      .limit(1)

    if (!dupes || dupes.length === 0) return ''

    const { data: setData } = await supabase
      .from('flashcard_sets')
      .select('name')
      .eq('id', dupes[0].set_id)
      .single()

    const setName = setData?.name ?? 'another set'
    return `"${frontText}" already exists in "${setName}" in this collection.`
  }

  async function saveFlashcard() {
    const { error } = await supabase.from('flashcards').insert([
      {
        front: front.trim(),
        back: back.trim(),
        set_id: setId,
        user_id: user!.id,
      },
    ])

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Flashcard saved successfully.')
      setFront('')
      setBack('')
      setDuplicateWarning('')
    }
    setLoading(false)
  }

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
    setDuplicateWarning('')

    if (collectionId) {
      const warning = await checkForDuplicate(front.trim())
      if (warning) {
        setDuplicateWarning(warning)
        setLoading(false)
        return
      }
    }

    await saveFlashcard()
  }

  async function handleSaveAnyway() {
    if (!user) return
    setLoading(true)
    setMessage('')
    setDuplicateWarning('')
    await saveFlashcard()
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
          onChange={(e) => {
            setFront(e.target.value)
            setDuplicateWarning('')
          }}
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

      {duplicateWarning && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-sm text-amber-800">{duplicateWarning}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveAnyway}
              disabled={loading}
              className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              Save Anyway
            </button>
            <button
              type="button"
              onClick={() => setDuplicateWarning('')}
              className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-black hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
