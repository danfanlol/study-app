'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { FlashcardSetCollection } from '@/types/flashcardSetCollection'
import DeleteCollectionButton from '@/components/DeleteCollectionButton'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type CollectionsListProps = {
  emptyMessage?: string
  mode?: 'browse' | 'delete'
}

export default function CollectionsList({
  emptyMessage = 'No collections found.',
  mode = 'browse',
}: CollectionsListProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const userId = user?.id ?? null
  const [collections, setCollections] = useState<FlashcardSetCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function fetchCollections() {
      if (!userId) {
        setCollections([])
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('flashcard_set_collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(`Error loading collections: ${error.message}`)
        setCollections([])
      } else {
        setCollections(data || [])
      }

      setLoading(false)
    }

    fetchCollections()
  }, [userId])

  if (userLoading || loading) {
    return <p>Loading collections...</p>
  }

  if (errorMessage) {
    return <p className="text-red-600">{errorMessage}</p>
  }

  if (!user) {
    return <p>Sign in to view your collections.</p>
  }

  if (collections.length === 0) {
    return <p>{emptyMessage}</p>
  }

  function handleRemoveDeleted(id: string) {
    setCollections((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="space-y-4">
      {collections.map((collection) =>
        mode === 'delete' ? (
          <div
            key={collection.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-lg font-semibold">{collection.name}</p>
            <DeleteCollectionButton
              collectionId={collection.id}
              collectionName={collection.name}
              onDelete={handleRemoveDeleted}
            />
          </div>
        ) : (
          <Link
            key={collection.id}
            href={`/sets/collections/${collection.id}`}
            className="flex items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:bg-gray-100"
          >
            <p className="text-lg font-semibold">{collection.name}</p>
          </Link>
        )
      )}
    </div>
  )
}
