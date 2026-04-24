import Link from 'next/link'
import AddCollection from '@/components/AddCollection'

export default function AddCollectionPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-8 shadow-lg">
        <Link
          href="/sets/collections"
          className="mb-6 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Collections
        </Link>
        <h1 className="mb-8 text-3xl font-bold">Add Collection</h1>
        <AddCollection />
      </div>
    </main>
  )
}
