import Link from 'next/link'
import CollectionsDashboard from '@/components/CollectionsDashboard'

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/sets"
          className="mb-6 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Flashcard Sets
        </Link>
        <h1 className="mb-8 text-3xl font-bold">Collections</h1>
        <CollectionsDashboard />
      </div>
    </main>
  )
}
