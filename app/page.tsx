import { SearchCards } from "@/components/search-cards"
import { Suspense } from "react"

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Pokémon TCG Analyzer
      </h1>
      <div className="max-w-3xl mx-auto">
        <Suspense fallback={<div>Chargement...</div>}>
          <SearchCards />
        </Suspense>
      </div>
    </main>
  )
}
