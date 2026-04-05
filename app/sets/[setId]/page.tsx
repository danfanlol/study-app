'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AddFlashcard from '@/components/AddFlashcard'
import ShowFlashcards from '@/components/ShowFlashcards'
import ReviewFlashcards from '@/components/ReviewFlashcards'
import RenameSetForm from '@/components/RenameSetForm'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type SetPageProps = {
  params: Promise<{
    setId: string
  }>
}

export default function SetDetailPage({ params }: SetPageProps) {
  const { setId } = use(params)
  const { user, loading: userLoading } = useSupabaseUser()
  const userId = user?.id ?? null
  const [view, setView] = useState<'add' | 'show' | 'review'>('add')
  const [setName, setSetName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadSetName() {
      if (!userId) {
        setSetName('')
        setErrorMessage('Please sign in to view this set.')
        return
      }

      const { data, error } = await supabase
        .from('flashcard_sets')
        .select('name')
        .eq('id', setId)
        .eq('user_id', userId)
        .single()

      if (error) {
        setSetName('')
        setErrorMessage('We could not find this set for your account.')
      } else if (data) {
        setSetName(data.name)
        setErrorMessage('')
      }
    }

    loadSetName()
  }, [setId, userId])

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href="/sets"
          className="mb-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Back to Flashcard Sets
        </Link>

        <div className="mb-6 space-y-3">
          <h1 className="text-3xl font-bold">{setName || 'Flashcard Set'}</h1>
          <p className="text-gray-600">Manage flashcards in this set.</p>
          {setName && !errorMessage && (
            <RenameSetForm
              currentName={setName}
              itemId={setId}
              itemLabel="flashcard set"
              tableName="flashcard_sets"
              onRename={setSetName}
              variant="header"
            />
          )}
        </div>

        {userLoading ? (
          <p>Checking session...</p>
        ) : errorMessage ? (
          <p className="mb-6 text-red-600">{errorMessage}</p>
        ) : (
          <>
            <div className="mb-8 flex gap-3">
              <button
                onClick={() => setView('add')}
                className={`rounded-lg px-4 py-2 font-medium ${
                  view === 'add' ? 'bg-black text-white' : 'bg-gray-200 text-black'
                }`}
              >
                Add Flashcard
              </button>

              <button
                onClick={() => setView('show')}
                className={`rounded-lg px-4 py-2 font-medium ${
                  view === 'show' ? 'bg-black text-white' : 'bg-gray-200 text-black'
                }`}
              >
                Show Flashcards
              </button>

              <button
                onClick={() => setView('review')}
                className={`rounded-lg px-4 py-2 font-medium ${
                  view === 'review' ? 'bg-black text-white' : 'bg-gray-200 text-black'
                }`}
              >
                Review Flashcards
              </button>
            </div>

            {view === 'add' && <AddFlashcard setId={setId} />}
            {view === 'show' && <ShowFlashcards setId={setId} />}
            {view === 'review' && <ReviewFlashcards setId={setId} />}
          </>
        )}
      </div>
    </main>
  )
}
