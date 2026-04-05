'use client'

import { use } from 'react'
import ProblemDetailView from '@/components/ProblemDetailView'

type ProblemDetailPageProps = {
  params: Promise<{
    problemSetId: string
    problemId: string
  }>
}

export default function ProblemDetailPage({ params }: ProblemDetailPageProps) {
  const { problemSetId, problemId } = use(params)
  return <ProblemDetailView problemSetId={problemSetId} problemId={problemId} />
}
