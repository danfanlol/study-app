'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-300 disabled:opacity-50"
    >
      {loading ? 'Signing Out...' : 'Sign Out'}
    </button>
  )
}
