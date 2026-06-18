'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      setMessage('Please enter your email address.')
      return
    }

    setLoading(true)
    setMessage('')

    const redirectTo = `${window.location.origin}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold">Forgot Password</h1>

        {sent ? (
          <div className="space-y-4">
            <p className="text-gray-700">
              Password reset email sent to <span className="font-medium">{email}</span>. Check your
              inbox and click the link to set a new password.
            </p>
            <Link href="/signin" className="inline-block text-sm font-medium text-blue-600 hover:underline">
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-black px-4 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              {message && <p className="text-sm text-gray-700">{message}</p>}
            </form>

            <div className="mt-6">
              <Link href="/signin" className="text-sm font-medium text-blue-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
