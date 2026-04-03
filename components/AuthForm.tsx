'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setMessage('Please enter both your email and password.')
      return
    }

    setLoading(true)
    setMessage('')

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setMessage(`Error signing in: ${error.message}`)
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (error) {
        setMessage(`Error creating account: ${error.message}`)
      } else {
        setMessage(
          'Account created. If email confirmation is enabled in Supabase, check your inbox before signing in.'
        )
        setMode('signin')
        setPassword('')
      }
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => {
            setMode('signin')
            setMessage('')
          }}
          className={`rounded-lg px-4 py-2 font-medium ${
            mode === 'signin' ? 'bg-black text-white' : 'bg-gray-200 text-black'
          }`}
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('signup')
            setMessage('')
          }}
          className={`rounded-lg px-4 py-2 font-medium ${
            mode === 'signup' ? 'bg-black text-white' : 'bg-gray-200 text-black'
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? mode === 'signin'
              ? 'Signing In...'
              : 'Creating Account...'
            : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
        </button>

        {message && <p className="text-sm text-gray-700">{message}</p>}
      </form>

      <Link href="/" className="inline-block text-sm font-medium text-blue-600 hover:underline">
        Back to Home
      </Link>
    </div>
  )
}
