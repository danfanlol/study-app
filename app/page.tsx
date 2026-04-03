'use client'

import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import useSupabaseUser from '@/hooks/useSupabaseUser'

export default function HomePage() {
  const { user, loading } = useSupabaseUser()

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Flashcard Study App</h1>
              <p className="mt-2 text-sm text-gray-600">
                {loading
                  ? 'Checking your session...'
                  : user
                    ? `Signed in as ${user.email}`
                    : 'Choose a study mode to continue.'}
              </p>
            </div>

            {user ? (
              <SignOutButton />
            ) : (
              <Link
                href="/signin"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="space-y-4">
            <Link
              href="/sets"
              className="block rounded-lg bg-black px-4 py-4 text-center font-medium text-white"
            >
              Flashcard Sets
            </Link>

            <Link
              href="/problems"
              className="block rounded-lg bg-blue-600 px-4 py-4 text-center font-medium text-white hover:bg-blue-700"
            >
              Problem Sets
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
