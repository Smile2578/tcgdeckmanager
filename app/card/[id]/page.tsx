"use client"

import { useEffect, useState, use } from "react"
import { CardDetails } from "@/components/card-details"
import { PokemonTCGService } from "@/services/pokemon-tcg"
import { PricePredictionService } from "@/services/price-prediction"
import type { PokemonCard } from "@/types/pokemon"

export default function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [card, setCard] = useState<PokemonCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCard = async () => {
      try {
        setIsLoading(true)
        const cardData = await PokemonTCGService.getCardById(id)
        if (!cardData) {
          setError("Carte non trouvée")
          return
        }

        // Prédiction de prix basée sur l'historique
        const priceHistory = cardData.marketPrices 
          ? [
              // Prix actuel
              { timestamp: new Date().toISOString(), price: cardData.marketPrices.avg1 },
              // Prix moyen 7 jours
              { timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), price: cardData.marketPrices.avg7 },
              // Prix moyen 30 jours
              { timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), price: cardData.marketPrices.avg30 },
              // Prix de tendance (généralement basé sur 90 jours)
              { timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), price: cardData.marketPrices.trendPrice },
              // Extrapolation des prix basée sur la tendance et l'historique de la série
              { 
                timestamp: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), 
                price: cardData.marketPrices.trendPrice * 0.95 
              },
              { 
                timestamp: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), 
                price: cardData.marketPrices.trendPrice * 0.9 
              }
            ]
          : [{ timestamp: new Date().toISOString(), price: cardData.prices.market }]

        const prediction = await PricePredictionService.predictPrice(priceHistory)

        // Adaptation des données au format PokemonCard
        setCard({
          ...cardData,
          number: cardData.number,
          variant: "normal",
          condition: "raw",
          prediction: {
            predictedPrice: prediction.predictedPrice,
            confidence: prediction.confidence,
            trend: prediction.trend,
            trendStrength: prediction.trendStrength,
            volatility: prediction.volatility,
            priceHistory: prediction.priceHistory,
            metrics: prediction.metrics,
            profitAnalysis: prediction.profitAnalysis
          }
        })
      } catch (error) {
        console.error("Erreur lors du chargement de la carte:", error)
        setError("Erreur lors du chargement de la carte")
      } finally {
        setIsLoading(false)
      }
    }

    loadCard()
  }, [id])

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Chargement...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>
  }

  if (!card) {
    return <div className="flex justify-center items-center min-h-screen">Carte non trouvée</div>
  }

  return (
    <div className="container mx-auto py-8">
      <CardDetails card={card} />
    </div>
  )
} 