'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DeleteFlashcardButton from '@/components/DeleteFlashcardButton'
import { Flashcard } from '@/types/flashcard'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type ShowFlashcardsProps = {
  setId: string
  filterQuery?: string
}

export default function ShowFlashcards({ setId, filterQuery = '' }: ShowFlashcardsProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const userId = user?.id ?? null
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => {
    async function loadFlashcards() {
      if (!userId) {
        setFlashcards([])
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('set_id', setId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(`Error loading flashcards: ${error.message}`)
        setFlashcards([])
      } else {
        setFlashcards(data || [])
      }

      setLoading(false)
    }

    loadFlashcards()
  }, [setId, userId])

  function handleRemoveDeletedCard(id: string) {
    setFlashcards((prev) => prev.filter((card) => card.id !== id))
    if (editingId === id) setEditingId(null)
  }

  function startEdit(card: Flashcard) {
    setEditingId(card.id)
    setEditFront(card.front)
    setEditBack(card.back)
    setEditError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError('')
  }

  async function saveEdit(card: Flashcard) {
    if (!editFront.trim() || !editBack.trim()) {
      setEditError('Both front and back are required.')
      return
    }

    if (!user) return

    setEditLoading(true)
    setEditError('')

    const { error } = await supabase
      .from('flashcards')
      .update({ front: editFront.trim(), back: editBack.trim() })
      .eq('id', card.id)
      .eq('user_id', user.id)

    if (error) {
      setEditError(`Error saving: ${error.message}`)
    } else {
      setFlashcards((prev) =>
        prev.map((c) =>
          c.id === card.id ? { ...c, front: editFront.trim(), back: editBack.trim() } : c
        )
      )
      setEditingId(null)
    }

    setEditLoading(false)
  }

  const query = filterQuery.trim().toLowerCase()
  const visibleCards = query
    ? flashcards.filter(
        (c) =>
          c.front.toLowerCase().includes(query) ||
          c.back.toLowerCase().includes(query)
      )
    : flashcards

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">All Flashcards</h2>

      {userLoading || loading ? (
        <p>Loading flashcards...</p>
      ) : !user ? (
        <p>Sign in to view flashcards in this set.</p>
      ) : errorMessage ? (
        <p>{errorMessage}</p>
      ) : flashcards.length === 0 ? (
        <p>No flashcards found in this set.</p>
      ) : visibleCards.length === 0 ? (
        <p>No flashcards match your search.</p>
      ) : (
        <div className="space-y-4">
          {visibleCards.map((card) =>
            editingId === card.id ? (
              <div
                key={card.id}
                className="rounded-xl border border-blue-300 bg-blue-50 p-4 shadow-sm"
              >
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-semibold">Front</label>
                  <textarea
                    value={editFront}
                    onChange={(e) => setEditFront(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-3">
                  <label className="mb-1 block text-sm font-semibold">Back</label>
                  <textarea
                    value={editBack}
                    onChange={(e) => setEditBack(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {editError && <p className="mb-2 text-sm text-red-600">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(card)}
                    disabled={editLoading}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {editLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={editLoading}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-black hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={card.id}
                className="rounded-xl border border-gray-200 p-4 shadow-sm"
              >
                <p className="mb-2">
                  <span className="font-semibold">Front:</span> {card.front}
                </p>
                <p className="mb-3">
                  <span className="font-semibold">Back:</span> {card.back}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(card)}
                    className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-black transition hover:bg-gray-300"
                  >
                    Edit
                  </button>
                  <DeleteFlashcardButton
                    flashcardId={card.id}
                    onDelete={handleRemoveDeletedCard}
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
