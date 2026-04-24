'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import { FlashcardSet } from '@/types/flashcardSet'

export default function AddCollection() {
  const router = useRouter()
  const { user, loading: userLoading } = useSupabaseUser()
  const [name, setName] = useState('')
  const [sets, setSets] = useState<FlashcardSet[]>([])
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set())
  const [loadingSets, setLoadingSets] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function fetchSets() {
      if (!user) {
        setLoadingSets(false)
        return
      }

      const { data, error } = await supabase
        .from('flashcard_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error) {
        setSets(data || [])
      }

      setLoadingSets(false)
    }

    if (!userLoading) {
      fetchSets()
    }
  }, [user, userLoading])

  function toggleSet(id: string) {
    setSelectedSetIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!name.trim()) {
      setErrorMessage('Please enter a collection name.')
      return
    }

    if (selectedSetIds.size === 0) {
      setErrorMessage('Please select at least one flashcard set.')
      return
    }

    if (!user) {
      setErrorMessage('Please sign in before creating a collection.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    const { data: collectionData, error: collectionError } = await supabase
      .from('flashcard_set_collections')
      .insert([{ name: name.trim(), user_id: user.id }])
      .select('id')
      .single()

    if (collectionError || !collectionData) {
      setErrorMessage(`Error creating collection: ${collectionError?.message}`)
      setSubmitting(false)
      return
    }

    const members = Array.from(selectedSetIds).map((setId, index) => ({
      collection_id: collectionData.id,
      set_id: setId,
      user_id: user.id,
      sort_order: index,
    }))

    const { error: membersError } = await supabase
      .from('flashcard_set_collection_members')
      .insert(members)

    if (membersError) {
      setErrorMessage(`Error adding sets to collection: ${membersError.message}`)
      setSubmitting(false)
      return
    }

    router.push('/sets/collections')
  }

  if (userLoading) {
    return <p>Loading...</p>
  }

  if (!user) {
    return <p className="text-red-600">Please sign in to create a collection.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="collection-name" className="mb-2 block text-sm font-medium">
          Collection Name
        </label>
        <input
          id="collection-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a collection name"
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium">Select Flashcard Sets</p>
        {loadingSets ? (
          <p>Loading flashcard sets...</p>
        ) : sets.length === 0 ? (
          <p className="text-sm text-gray-500">
            No flashcard sets found. Create some first.
          </p>
        ) : (
          <div className="space-y-2">
            {sets.map((set) => (
              <label
                key={set.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedSetIds.has(set.id)}
                  onChange={() => toggleSet(set.id)}
                  className="h-4 w-4"
                />
                <span className="font-medium">{set.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={submitting || loadingSets}
        className="rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Creating...' : 'Create Collection'}
      </button>
    </form>
  )
}
