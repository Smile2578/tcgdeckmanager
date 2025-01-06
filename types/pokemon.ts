import { PricePrediction } from "@/services/price-prediction"

export type CardCondition = "raw" | "PSA 8" | "PSA 9" | "PSA 10"
export type CardVariant = "normal" | "holo" | "reverse"

export interface PokemonCard {
  id: string
  name: string
  image: string
  rarity: string
  set: string
  setId: string
  number: string
  variant: CardVariant
  condition: CardCondition
  prices: {
    market: number
    low: number
    mid: number
    high: number
  }
  marketPrices?: {
    avg1: number
    avg7: number
    avg30: number
    trendPrice: number
  }
  links?: {
    tcgplayer?: string
    cardmarket?: string
  }
  prediction: PricePrediction
} 