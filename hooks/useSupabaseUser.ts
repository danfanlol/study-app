'use client'

import { useAuthContext } from '@/components/AuthProvider'

export default function useSupabaseUser() {
  return useAuthContext()
}
