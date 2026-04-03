'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'

const PROBLEM_IMAGES_BUCKET = 'problem-images'

type AddProblemProps = {
  problemSetId: string
}

export default function AddProblem({ problemSetId }: AddProblemProps) {
  const router = useRouter()
  const { user, loading: userLoading } = useSupabaseUser()
  const [title, setTitle] = useState('')
  const [explanation, setExplanation] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!title.trim()) {
      setMessage('Please enter a title for this problem.')
      return
    }

    if (imageFiles.length === 0) {
      setMessage('Please choose at least one image.')
      return
    }

    if (!user) {
      setMessage('Please sign in before saving a problem.')
      return
    }

    setLoading(true)
    setMessage('')

    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .insert([
        {
          user_id: user.id,
          problem_set_id: problemSetId,
          title: title.trim(),
          explanation: explanation.trim() || null,
        },
      ])
      .select('id')
      .single()

    if (problemError || !problem) {
      setMessage(`Error saving problem: ${problemError?.message || 'Unknown error.'}`)
      setLoading(false)
      return
    }

    for (const [index, file] of imageFiles.entries()) {
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const storagePath = `${user.id}/${problemSetId}/${problem.id}/${crypto.randomUUID()}.${fileExtension}`

      const { error: uploadError } = await supabase.storage
        .from(PROBLEM_IMAGES_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        setMessage(`Problem saved, but an image upload failed: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { error: imageError } = await supabase.from('problem_images').insert([
        {
          user_id: user.id,
          problem_id: problem.id,
          storage_path: storagePath,
          caption: null,
          sort_order: index,
        },
      ])

      if (imageError) {
        setMessage(`Problem saved, but image metadata failed: ${imageError.message}`)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    router.push(`/problems/${problemSetId}/${problem.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!userLoading && !user && (
        <p className="text-sm text-red-600">Please sign in before saving a problem.</p>
      )}

      <div>
        <label htmlFor="problem-title" className="mb-2 block text-sm font-medium">
          Title
        </label>
        <input
          id="problem-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a title for this problem"
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="problem-explanation" className="mb-2 block text-sm font-medium">
          Explanation
        </label>
        <textarea
          id="problem-explanation"
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
          placeholder="Optional explanation or notes"
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
        />
      </div>

      <div>
        <label htmlFor="problem-images" className="mb-2 block text-sm font-medium">
          Problem Images
        </label>
        <input
          id="problem-images"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setImageFiles(Array.from(event.target.files || []))}
          className="w-full rounded-lg border p-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
        {imageFiles.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {imageFiles.length} image{imageFiles.length === 1 ? '' : 's'} selected
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || userLoading || !user}
        className="w-full rounded-lg bg-black px-4 py-3 text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Saving Problem...' : 'Save Problem'}
      </button>

      {message && <p className="text-sm text-gray-700">{message}</p>}
    </form>
  )
}
