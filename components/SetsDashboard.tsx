'use client'

import { useState } from 'react'
import Link from 'next/link'
import SetsList from '@/components/SetsList'
import useSupabaseUser from '@/hooks/useSupabaseUser'

export default function SetsDashboard() {
  const { user } = useSupabaseUser()
  const [showDeleteOptions, setShowDeleteOptions] = useState(false)

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {user ? (
          <>
            <Link
              href="/sets/create"
              className="block rounded-lg bg-black px-4 py-3 text-center font-medium text-white"
            >
              Create Flashcard Set
            </Link>

            <button
              type="button"
              onClick={() => setShowDeleteOptions((prev) => !prev)}
              className={`block w-full rounded-lg px-4 py-3 text-center font-medium transition ${
                showDeleteOptions
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-200 text-black hover:bg-gray-300'
              }`}
            >
              {showDeleteOptions ? 'Done Deleting' : 'Delete Flashcard Set'}
            </button>
          </>
        ) : (
          <Link
            href="/signin"
            className="block rounded-lg bg-black px-4 py-3 text-center font-medium text-white"
          >
            Sign In to Get Started
          </Link>
        )}
      </div>

      <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Your Flashcard Sets</h2>
              {user && showDeleteOptions && (
                <p className="mt-1 text-sm text-red-600">
                  Delete mode is on. Choose a flashcard set below to remove it.
                </p>
              )}
            </div>
        </div>

        <SetsList
          emptyMessage="No flashcard sets yet. Create your first one above."
          mode={showDeleteOptions && user ? 'delete' : 'browse'}
        />
      </section>
    </div>
  )
}
