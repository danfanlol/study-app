'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const resolved = useRef(false)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Implicit flow: Supabase processes the hash and fires PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        resolved.current = true
        setStatus('ready')
      }
    })

    // PKCE flow: code is a query param
    const code = searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (resolved.current) return
        if (error) {
          setStatus('error')
        } else {
          resolved.current = true
          setStatus('ready')
        }
      })
    } else {
      // Give the onAuthStateChange listener time to fire for implicit flow
      const timer = setTimeout(() => {
        if (!resolved.current) setStatus('error')
      }, 1500)
      return () => {
        subscription.unsubscribe()
        clearTimeout(timer)
      }
    }

    return () => subscription.unsubscribe()
  }, [searchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!password || !confirm) {
      setMessage('Please fill in both fields.')
      return
    }
    if (password !== confirm) {
      setMessage('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-10">
        <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-3xl font-bold">Reset Password</h1>
          <p className="mb-4 text-gray-700">
            Invalid or expired reset link. Please request a new one.
          </p>
          <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
            Request a new reset link
          </Link>
        </div>
      </main>
    )
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-100 px-4 py-10">
        <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-3xl font-bold">Set New Password</h1>
        <p className="mb-6 text-gray-600">Enter and confirm your new password below.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-2 block text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Set New Password'}
          </button>

          {message && <p className="text-sm text-gray-700">{message}</p>}
        </form>
      </div>
    </main>
  )
}
