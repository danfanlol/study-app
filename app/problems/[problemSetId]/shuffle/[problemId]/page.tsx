'use client'

import { use } from 'react'
import ProblemDetailView from '@/components/ProblemDetailView'

type ShuffleProblemDetailPageProps = {
  params: Promise<{
    problemSetId: string
    problemId: string
  }>
}

export default function ShuffleProblemDetailPage({
  params,
}: ShuffleProblemDetailPageProps) {
  const { problemSetId, problemId } = use(params)

  return (
    <ProblemDetailView
      problemSetId={problemSetId}
      problemId={problemId}
      shuffleMode
    />
  )
}
