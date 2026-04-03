'use client'

import Link from 'next/link'
import AuthForm from '@/components/AuthForm'
import useSupabaseUser from '@/hooks/useSupabaseUser'

export default function SignInPage() {
  const { user, loading } = useSupabaseUser()

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold">Sign In</h1>
        <p className="mb-6 text-gray-600">
          Use your email and password to access your flashcard sets.
        </p>

        {loading ? (
          <p>Checking session...</p>
        ) : user ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              You are already signed in as <span className="font-medium">{user.email}</span>.
            </p>
            <Link href="/" className="inline-block text-sm font-medium text-blue-600 hover:underline">
              Back to Home
            </Link>
          </div>
        ) : (
          <AuthForm />
        )}
      </div>
    </main>
  )
}
