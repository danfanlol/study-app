'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import { FlashcardSet } from '@/types/flashcardSet'
import { FlashcardSetCollection } from '@/types/flashcardSetCollection'

function GripIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="shrink-0 text-gray-400"
    >
      <circle cx="5" cy="4" r="1.5" />
      <circle cx="11" cy="4" r="1.5" />
      <circle cx="5" cy="8" r="1.5" />
      <circle cx="11" cy="8" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="11" cy="12" r="1.5" />
    </svg>
  )
}

function SortableSetItem({ set }: { set: FlashcardSet }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: set.id })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="flex cursor-grab items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:cursor-grabbing"
    >
      <GripIcon />
      <p className="text-lg font-semibold">{set.name}</p>
    </div>
  )
}

export default function CollectionDetailPage() {
  const params = useParams()
  const collectionId = params.collectionId as string
  const { user, loading: userLoading } = useSupabaseUser()
  const userId = user?.id ?? null

  const [collection, setCollection] = useState<FlashcardSetCollection | null>(null)
  const [sets, setSets] = useState<FlashcardSet[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FlashcardSet[] | null>(null)
  const [searching, setSearching] = useState(false)

  const [reorderMode, setReorderMode] = useState(false)
  const [reorderedSets, setReorderedSets] = useState<FlashcardSet[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    async function loadCollection() {
      if (!userId) {
        setCollection(null)
        setSets([])
        setErrorMessage('Please sign in to view this collection.')
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data: collectionData, error: collectionError } = await supabase
        .from('flashcard_set_collections')
        .select('*')
        .eq('id', collectionId)
        .eq('user_id', userId)
        .single()

      if (collectionError || !collectionData) {
        setErrorMessage('Collection not found.')
        setLoading(false)
        return
      }

      setCollection(collectionData)

      const { data: memberData, error: memberError } = await supabase
        .from('flashcard_set_collection_members')
        .select('set_id')
        .eq('collection_id', collectionId)
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (memberError) {
        setErrorMessage(`Error loading collection sets: ${memberError.message}`)
        setLoading(false)
        return
      }

      const setIds = (memberData || []).map((m) => m.set_id)

      if (setIds.length === 0) {
        setSets([])
        setLoading(false)
        return
      }

      const { data: setsData, error: setsError } = await supabase
        .from('flashcard_sets')
        .select('*')
        .in('id', setIds)
        .eq('user_id', userId)

      if (setsError) {
        setErrorMessage(`Error loading flashcard sets: ${setsError.message}`)
        setLoading(false)
        return
      }

      // Re-order sets according to the member sort_order sequence
      const setMap = new Map((setsData || []).map((s) => [s.id, s]))
      const orderedSets = setIds
        .map((id) => setMap.get(id))
        .filter((s): s is FlashcardSet => s !== undefined)

      setSets(orderedSets)
      setLoading(false)
    }

    loadCollection()
  }, [collectionId, userId])

  async function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const term = searchQuery.trim()
    if (!term || !userId || sets.length === 0) return

    setSearching(true)

    const setIds = sets.map((s) => s.id)

    const { data, error } = await supabase
      .from('flashcards')
      .select('set_id')
      .ilike('front', `%${term}%`)
      .in('set_id', setIds)
      .eq('user_id', userId)

    if (!error) {
      const matchedSetIds = new Set((data || []).map((row) => row.set_id))
      setSearchResults(sets.filter((s) => matchedSetIds.has(s.id)))
    }

    setSearching(false)
  }

  function clearSearch() {
    setSearchQuery('')
    setSearchResults(null)
  }

  function enterReorderMode() {
    setReorderedSets([...sets])
    setReorderMode(true)
    setSearchResults(null)
    setSearchQuery('')
    setSaveError('')
  }

  function cancelReorder() {
    setReorderMode(false)
    setReorderedSets([])
    setSaveError('')
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setReorderedSets((items) => {
        const oldIndex = items.findIndex((s) => s.id === active.id)
        const newIndex = items.findIndex((s) => s.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  async function saveOrder() {
    if (!userId) return
    setSaving(true)
    setSaveError('')

    const results = await Promise.all(
      reorderedSets.map((set, index) =>
        supabase
          .from('flashcard_set_collection_members')
          .update({ sort_order: index })
          .eq('collection_id', collectionId)
          .eq('set_id', set.id)
          .eq('user_id', userId)
      )
    )

    const failed = results.find((r) => r.error)
    if (failed?.error) {
      setSaveError(`Error saving order: ${failed.error.message}`)
    } else {
      setSets(reorderedSets)
      setReorderMode(false)
      setReorderedSets([])
    }

    setSaving(false)
  }

  const displayedSets = searchResults !== null ? searchResults : sets

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/sets/collections"
          className="mb-6 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Collections
        </Link>

        {userLoading || loading ? (
          <p>Loading collection...</p>
        ) : errorMessage ? (
          <p className="text-red-600">{errorMessage}</p>
        ) : collection ? (
          <>
            <h1 className="mb-6 text-3xl font-bold">{collection.name}</h1>

            {sets.length > 0 && !reorderMode && (
              <>
                <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (e.target.value === '') setSearchResults(null)
                    }}
                    placeholder="Search flashcard fronts..."
                    className="flex-1 rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                  {searchResults !== null && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="rounded-lg bg-gray-200 px-4 py-3 font-medium text-black hover:bg-gray-300"
                    >
                      Clear
                    </button>
                  )}
                </form>

                <button
                  type="button"
                  onClick={enterReorderMode}
                  className="mb-6 block w-full rounded-lg bg-gray-200 px-4 py-3 text-center font-medium text-black transition hover:bg-gray-300"
                >
                  Reorder Sets
                </button>
              </>
            )}

            {reorderMode && (
              <div className="mb-6 flex gap-3">
                <button
                  type="button"
                  onClick={saveOrder}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-black px-4 py-3 text-center font-medium text-white disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Order'}
                </button>
                <button
                  type="button"
                  onClick={cancelReorder}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-3 text-center font-medium text-black hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}

            {saveError && <p className="mb-4 text-sm text-red-600">{saveError}</p>}

            {searchResults !== null && (
              <p className="mb-4 text-sm text-gray-500">
                {searchResults.length === 0
                  ? `No sets found containing "${searchQuery.trim()}"`
                  : `${searchResults.length} set${searchResults.length === 1 ? '' : 's'} contain "${searchQuery.trim()}"`}
              </p>
            )}

            {reorderMode ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={reorderedSets.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {reorderedSets.map((set) => (
                      <SortableSetItem key={set.id} set={set} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : displayedSets.length === 0 && searchResults === null ? (
              <p className="text-gray-500">No flashcard sets in this collection.</p>
            ) : displayedSets.length > 0 ? (
              <div className="space-y-4">
                {displayedSets.map((set) => (
                  <Link
                    key={set.id}
                    href={`/sets/${set.id}`}
                    className="flex items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:bg-gray-100"
                  >
                    <p className="text-lg font-semibold">{set.name}</p>
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  )
}
