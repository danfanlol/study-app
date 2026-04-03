'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Flashcard } from '@/types/flashcard'
import useSupabaseUser from '@/hooks/useSupabaseUser'

type ReviewFlashcardsProps = {
  setId: string
}

export default function ReviewFlashcards({
  setId,
}: ReviewFlashcardsProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [showBack, setShowBack] = useState(false)
  const [reviewComplete, setReviewComplete] = useState(false)

  useEffect(() => {
    async function loadFlashcards() {
      if (!user) {
        setFlashcards([])
        setReviewQueue([])
        setReviewComplete(true)
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('set_id', setId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(`Error loading flashcards: ${error.message}`)
        setFlashcards([])
        setReviewQueue([])
        setReviewComplete(true)
      } else {
        const cards = data || []
        setFlashcards(cards)
        setReviewQueue(cards)
        setReviewComplete(cards.length === 0)
        setShowBack(false)
      }

      setLoading(false)
    }

    loadFlashcards()
  }, [setId, user])

  function handleCorrect() {
    if (reviewQueue.length === 0) return

    const updatedQueue = reviewQueue.slice(1)
    setReviewQueue(updatedQueue)
    setShowBack(false)

    if (updatedQueue.length === 0) {
      setReviewComplete(true)
    }
  }

  function handleWrong() {
    if (reviewQueue.length === 0) return

    const currentCard = reviewQueue[0]
    const updatedQueue = [...reviewQueue.slice(1), currentCard]

    setReviewQueue(updatedQueue)
    setShowBack(false)
  }

  function startReviewAgain() {
    setReviewQueue([...flashcards])
    setShowBack(false)
    setReviewComplete(flashcards.length === 0)
  }

  const currentCard = reviewQueue[0]

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Review Flashcards</h2>

      {userLoading || loading ? (
        <p>Loading flashcards...</p>
      ) : !user ? (
        <p>Sign in to review your flashcards.</p>
      ) : errorMessage ? (
        <p>{errorMessage}</p>
      ) : flashcards.length === 0 ? (
        <p>No flashcards available in this set.</p>
      ) : reviewComplete ? (
        <div className="space-y-4">
          <p className="text-lg font-medium">Review session complete.</p>
          <button
            onClick={startReviewAgain}
            className="rounded-lg bg-black px-4 py-3 font-medium text-white"
          >
            Start Again
          </button>
        </div>
      ) : currentCard ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Remaining cards in session: {reviewQueue.length}
          </p>

          <div className="min-h-[220px] rounded-2xl border-2 border-gray-300 p-6 shadow-sm">
            <p className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
              {showBack ? 'Back' : 'Front'}
            </p>
            <p className="text-xl font-semibold">
              {showBack ? currentCard.back : currentCard.front}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowBack((prev) => !prev)}
              className="rounded-lg bg-gray-200 px-4 py-3 font-medium text-black"
            >
              {showBack ? 'Show Front' : 'Flip Card'}
            </button>

            {showBack && (
              <>
                <button
                  onClick={handleCorrect}
                  className="rounded-lg bg-green-600 px-4 py-3 font-medium text-white"
                >
                  Correct
                </button>

                <button
                  onClick={handleWrong}
                  className="rounded-lg bg-red-600 px-4 py-3 font-medium text-white"
                >
                  Wrong
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
