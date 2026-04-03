'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import { Problem } from '@/types/problem'
import { ProblemImage } from '@/types/problemImage'

const PROBLEM_IMAGES_BUCKET = 'problem-images'

type ProblemDetailPageProps = {
  params: Promise<{
    problemSetId: string
    problemId: string
  }>
}

type ProblemImageWithUrl = ProblemImage & {
  signedUrl: string | null
}

export default function ProblemDetailPage({ params }: ProblemDetailPageProps) {
  const { problemSetId, problemId } = use(params)
  const { user, loading: userLoading } = useSupabaseUser()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [images, setImages] = useState<ProblemImageWithUrl[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadProblem() {
      if (!user) {
        setProblem(null)
        setImages([])
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
        .eq('user_id', user.id)
        .single()

      if (problemError || !problemData) {
        setProblem(null)
        setImages([])
        setErrorMessage('We could not find this problem for your account.')
        setLoading(false)
        return
      }

      const { data: imageData, error: imageError } = await supabase
        .from('problem_images')
        .select('*')
        .eq('problem_id', problemId)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (imageError) {
        setProblem(problemData)
        setImages([])
        setErrorMessage(`Error loading images: ${imageError.message}`)
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
      setShowExplanation(false)
      setLoading(false)
    }

    loadProblem()
  }, [problemId, problemSetId, user])

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
              <h1 className="text-3xl font-bold">{problem.title}</h1>

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
