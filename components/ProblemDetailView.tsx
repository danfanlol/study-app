'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import { Problem } from '@/types/problem'
import { ProblemImage } from '@/types/problemImage'
import EditProblemForm from '@/components/EditProblemForm'

const PROBLEM_IMAGES_BUCKET = 'problem-images'

type ProblemImageWithUrl = ProblemImage & {
  signedUrl: string | null
}

type ProblemDetailViewProps = {
  problemSetId: string
  problemId: string
  shuffleMode?: boolean
}

export default function ProblemDetailView({
  problemSetId,
  problemId,
  shuffleMode = false,
}: ProblemDetailViewProps) {
  const router = useRouter()
  const { user, loading: userLoading } = useSupabaseUser()
  const userId = user?.id ?? null
  const [problem, setProblem] = useState<Problem | null>(null)
  const [images, setImages] = useState<ProblemImageWithUrl[]>([])
  const [problemIds, setProblemIds] = useState<string[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shuffleLoading, setShuffleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadProblem() {
      if (!userId) {
        setProblem(null)
        setImages([])
        setProblemIds([])
        setErrorMessage('Please sign in to view this problem.')
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage('')

      const { data: problemData, error: problemError } = await supabase
        .from('problems')
        .select('*')
        .eq('id', problemId)
        .eq('problem_set_id', problemSetId)
        .eq('user_id', userId)
        .single()

      if (problemError || !problemData) {
        setProblem(null)
        setImages([])
        setProblemIds([])
        setErrorMessage('We could not find this problem for your account.')
        setLoading(false)
        return
      }

      const [{ data: imageData, error: imageError }, shuffleResult] = await Promise.all([
        supabase
          .from('problem_images')
          .select('*')
          .eq('problem_id', problemId)
          .eq('user_id', userId)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        shuffleMode
          ? supabase
              .from('problems')
              .select('id')
              .eq('problem_set_id', problemSetId)
              .eq('user_id', userId)
          : Promise.resolve({ data: null, error: null }),
      ])

      if (imageError) {
        setProblem(problemData)
        setImages([])
        setProblemIds([])
        setErrorMessage(`Error loading images: ${imageError.message}`)
        setLoading(false)
        return
      }

      if (shuffleResult.error) {
        setProblem(problemData)
        setImages([])
        setProblemIds([])
        setErrorMessage(`Error loading shuffle problems: ${shuffleResult.error.message}`)
        setLoading(false)
        return
      }

      const imagesWithUrls = await Promise.all(
        (imageData || []).map(async (imageRecord) => {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(PROBLEM_IMAGES_BUCKET)
            .createSignedUrl(imageRecord.storage_path, 60 * 60)

          return {
            ...imageRecord,
            signedUrl: signedUrlError ? null : signedUrlData.signedUrl,
          }
        })
      )

      setProblem(problemData)
      setImages(imagesWithUrls)
      setProblemIds((shuffleResult.data || []).map((item) => item.id))
      setShowExplanation(false)
      setLoading(false)
      setShuffleLoading(false)
    }

    loadProblem()
  }, [problemId, problemSetId, shuffleMode, userId])

  function handleNextShuffleProblem() {
    if (!shuffleMode || shuffleLoading || problemIds.length === 0) {
      return
    }

    const candidates =
      problemIds.length > 1
        ? problemIds.filter((candidateId) => candidateId !== problemId)
        : problemIds

    if (candidates.length === 0) {
      return
    }

    const nextProblemId = candidates[Math.floor(Math.random() * candidates.length)]
    setShuffleLoading(true)
    router.push(`/problems/${problemSetId}/shuffle/${nextProblemId}`)
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href={`/problems/${problemSetId}`}
          className="mb-4 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          Back to Problem Set
        </Link>

        {userLoading || loading ? (
          <p>Loading problem...</p>
        ) : errorMessage ? (
          <p className="text-red-600">{errorMessage}</p>
        ) : problem ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl font-bold">{problem.title}</h1>

                <EditProblemForm
                  problemId={problem.id}
                  problemSetId={problemSetId}
                  currentTitle={problem.title}
                  currentExplanation={problem.explanation}
                  onSave={({ title, explanation }) => {
                    setProblem((prev) =>
                      prev
                        ? {
                            ...prev,
                            title,
                            explanation,
                          }
                        : prev
                    )
                    setShowExplanation(Boolean(explanation))
                  }}
                  onDelete={() => {
                    setProblem(null)
                    setImages([])
                  }}
                />
              </div>

              {shuffleMode && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
                    SHUFFLE
                  </span>
                  <button
                    type="button"
                    onClick={handleNextShuffleProblem}
                    disabled={shuffleLoading || problemIds.length === 0}
                    className="rounded-lg bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {shuffleLoading ? 'Loading Next Problem...' : 'Next Problem'}
                  </button>
                </div>
              )}

              {problem.explanation && (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowExplanation((prev) => !prev)}
                    className="rounded-lg bg-gray-200 px-4 py-3 font-medium text-black"
                  >
                    {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
                  </button>

                  {showExplanation && (
                    <p className="whitespace-pre-wrap text-gray-700">
                      {problem.explanation}
                    </p>
                  )}
                </div>
              )}
            </div>

            {images.length === 0 ? (
              <p>No images were saved for this problem.</p>
            ) : (
              <div className="space-y-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                  >
                    {image.signedUrl ? (
                      <Image
                        src={image.signedUrl}
                        alt={image.caption || problem.title}
                        width={1600}
                        height={1200}
                        unoptimized
                        className="h-auto w-full object-cover"
                      />
                    ) : (
                      <p className="p-4 text-sm text-red-600">
                        We could not load this image.
                      </p>
                    )}
                    {image.caption && (
                      <p className="border-t border-gray-200 p-4 text-sm text-gray-600">
                        {image.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  )
}
