'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import { Problem } from '@/types/problem'
import DeleteProblemButton from '@/components/DeleteProblemButton'

const PROBLEM_IMAGES_BUCKET = 'problem-images'

type ProblemsListProps = {
  problemSetId: string
  emptyMessage?: string
  mode?: 'browse' | 'delete'
  filterQuery?: string
}

export default function ProblemsList({
  problemSetId,
  emptyMessage = 'No problems found.',
  mode = 'browse',
  filterQuery = '',
}: ProblemsListProps) {
  const { user, loading: userLoading } = useSupabaseUser()
  const userId = user?.id ?? null
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [problemIdsWithImages, setProblemIdsWithImages] = useState<Set<string>>(new Set())

  const [previewProblem, setPreviewProblem] = useState<Problem | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadProblems() {
      if (!userId) {
        setProblems([])
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('user_id', userId)
        .eq('problem_set_id', problemSetId)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(`Error loading problems: ${error.message}`)
        setProblems([])
        setLoading(false)
        return
      }

      const loaded = data || []
      setProblems(loaded)

      if (loaded.length > 0) {
        const ids = loaded.map((p) => p.id)
        const { data: imgData } = await supabase
          .from('problem_images')
          .select('problem_id')
          .in('problem_id', ids)
          .eq('user_id', userId)

        setProblemIdsWithImages(new Set((imgData || []).map((r) => r.problem_id)))
      }

      setLoading(false)
    }

    loadProblems()
  }, [problemSetId, userId])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePreview()
    }
    if (previewProblem) {
      window.addEventListener('keydown', onKeyDown)
    }
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [previewProblem])

  async function openPreview(problem: Problem) {
    setPreviewProblem(problem)
    setPreviewImageUrl(null)
    setPreviewLoading(true)

    const { data: imageRecord } = await supabase
      .from('problem_images')
      .select('storage_path')
      .eq('problem_id', problem.id)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (imageRecord) {
      const { data: urlData } = await supabase.storage
        .from(PROBLEM_IMAGES_BUCKET)
        .createSignedUrl(imageRecord.storage_path, 60 * 60)
      setPreviewImageUrl(urlData?.signedUrl ?? null)
    }

    setPreviewLoading(false)
  }

  function closePreview() {
    setPreviewProblem(null)
    setPreviewImageUrl(null)
  }

  if (userLoading || loading) {
    return <p>Loading problems...</p>
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>
  }

  if (!user) {
    return <p>Sign in to view your saved problems.</p>
  }

  if (problems.length === 0) {
    return <p>{emptyMessage}</p>
  }

  const filteredProblems = filterQuery.trim()
    ? problems.filter((p) =>
        p.title.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : problems

  function handleRemoveDeletedProblem(id: string) {
    setProblems((prev) => prev.filter((problem) => problem.id !== id))
  }

  if (filteredProblems.length === 0) {
    return <p className="text-gray-500">No problems match &ldquo;{filterQuery}&rdquo;.</p>
  }

  return (
    <>
      <div className="space-y-4">
        {filteredProblems.map((problem) =>
          mode === 'delete' ? (
            <div
              key={problem.id}
              className="group flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold">{problem.title}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {problemIdsWithImages.has(problem.id) && (
                  <button
                    type="button"
                    onClick={() => openPreview(problem)}
                    className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-black opacity-0 transition-opacity duration-200 hover:bg-gray-200 group-hover:opacity-100"
                  >
                    Preview
                  </button>
                )}
                <DeleteProblemButton
                  problemId={problem.id}
                  problemTitle={problem.title}
                  onDelete={handleRemoveDeletedProblem}
                />
              </div>
            </div>
          ) : (
            <div
              key={problem.id}
              className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50"
            >
              <Link
                href={`/problems/${problemSetId}/${problem.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 p-4"
              >
                <p className="text-lg font-semibold">{problem.title}</p>
              </Link>

              {problemIdsWithImages.has(problem.id) && (
                <button
                  type="button"
                  onClick={() => openPreview(problem)}
                  className="mr-4 shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-black opacity-0 transition-opacity duration-200 hover:bg-gray-200 group-hover:opacity-100"
                >
                  Preview
                </button>
              )}
            </div>
          )
        )}
      </div>

      {previewProblem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closePreview}
        >
          <div
            ref={modalRef}
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <p className="font-semibold">{previewProblem.title}</p>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-black"
                aria-label="Close preview"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                </svg>
              </button>
            </div>

            <div className="flex min-h-48 items-center justify-center p-6">
              {previewLoading ? (
                <p className="text-gray-500">Loading image...</p>
              ) : previewImageUrl ? (
                <Image
                  src={previewImageUrl}
                  alt={previewProblem.title}
                  width={1600}
                  height={1200}
                  unoptimized
                  className="h-auto max-h-[70vh] w-full object-contain"
                />
              ) : (
                <p className="text-gray-500">Could not load image.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
