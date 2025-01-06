"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import Image from "next/image"
import { PokemonTCGService } from "@/services/pokemon-tcg"
import { PricePredictionService } from "@/services/price-prediction"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

type CardCondition = "raw" | "PSA 8" | "PSA 9" | "PSA 10"
type CardVariant = "normal" | "holo" | "reverse"

interface PokemonCard {
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
  prediction: {
    predictedPrice: number
    confidence: number
    trend: 'up' | 'down' | 'stable'
    trendStrength: number
    volatility: number
    priceHistory: {
      timestamp: string
      price: number
      volume?: number
    }[]
    profitAnalysis: {
      expectedProfit: number
      roi: number
      investmentScore: number
      riskLevel: 'low' | 'medium' | 'high'
      timeToProfit: number
    }
    metrics: {
      temporal: {
        current: number
        day: {
          avg: number
          min: number
          max: number
          change: number
          volume: number
        }
        week: {
          avg: number
          min: number
          max: number
          change: number
          volume: number
        }
        month: {
          avg: number
          min: number
          max: number
          change: number
          volume: number
        }
        year: {
          avg: number
          min: number
          max: number
          change: number
          volume: number
        }
        allTime: {
          avg: number
          min: number
          max: number
          change: number
          volume: number
        }
      }
      technical: {
        rsi: number
        momentum: number
        volatility: number
        macd: {
          value: number
          signal: number
          histogram: number
        }
        bollingerBands: {
          upper: number
          middle: number
          lower: number
        }
      }
      seasonality: {
        detected: boolean
        period: number | null
        strength: number
        nextPeak: string | null
        nextTrough: string | null
      }
    }
  }
}

const CONDITION_MULTIPLIERS: Record<CardCondition, number> = {
  "raw": 1,
  "PSA 8": 3,
  "PSA 9": 5,
  "PSA 10": 10
}

interface SetInfo {
  id: string
  name: string
  series: string
  releaseDate: string
}

interface GroupedSets {
  [series: string]: SetInfo[]
}

// Ordre des séries (du plus récent au plus ancien)
const SERIES_ORDER = [
  "Scarlet & Violet",
  "Sword & Shield",
  "Sun & Moon",
  "XY",
  "Black & White",
  "HeartGold & SoulSilver",
  "Platinum",
  "Diamond & Pearl",
  "EX",
  "e-Card",
  "Neo",
  "Gym",
  "Base"
] as const

type SortOption = "investment_score" | "roi" | "rsi_buy" | "rsi_sell" | "confidence" | "price_asc" | "price_desc" | "number"

const SORT_OPTIONS: Record<SortOption, { label: string, description: string }> = {
  number: {
    label: "Numéro de carte",
    description: "Trie par numéro de carte dans le set"
  },
  investment_score: {
    label: "Meilleur potentiel d'investissement",
    description: "Trie par score d'investissement (prix, profit potentiel, RSI)"
  },
  roi: {
    label: "Meilleur retour sur investissement",
    description: "Trie par ROI attendu"
  },
  rsi_buy: { 
    label: "Opportunités d'achat", 
    description: "Trie par RSI bas (< 30) et MACD positif"
  },
  rsi_sell: { 
    label: "Signaux de vente", 
    description: "Trie par RSI élevé (> 70)"
  },
  confidence: { 
    label: "Confiance de prédiction", 
    description: "Trie par niveau de confiance dans la prédiction"
  },
  price_asc: { 
    label: "Prix croissant", 
    description: "Du moins cher au plus cher"
  },
  price_desc: { 
    label: "Prix décroissant", 
    description: "Du plus cher au moins cher"
  }
}

export function SearchCards() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [selectedSet, setSelectedSet] = useState(searchParams.get("set") || "all")
  const [selectedCondition, setSelectedCondition] = useState<CardCondition>((searchParams.get("condition") as CardCondition) || "raw")
  const [searchResults, setSearchResults] = useState<PokemonCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sets, setSets] = useState<SetInfo[]>([])
  const [sortBy, setSortBy] = useState<SortOption>("rsi_buy")

  useEffect(() => {
    const loadSets = async () => {
      try {
        const setsData = await PokemonTCGService.getSets()
        setSets(setsData)
      } catch (error) {
        console.error("Erreur lors du chargement des sets:", error)
        setError("Impossible de charger la liste des sets")
      }
    }
    loadSets()
  }, [])

  // Fonction pour grouper les sets par série
  const groupSetsBySeries = (sets: SetInfo[]): GroupedSets => {
    const grouped = sets.reduce((acc: GroupedSets, set) => {
      if (!acc[set.series]) {
        acc[set.series] = []
      }
      acc[set.series].push(set)
      return acc
    }, {})

    // Trier les sets par date de sortie dans chaque série
    Object.keys(grouped).forEach(series => {
      grouped[series].sort((a, b) => 
        new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      )
    })

    return grouped
  }

  const handleSearch = async () => {
    // Bloquer la recherche si aucun set n'est sélectionné et pas de terme de recherche
    if (!searchTerm.trim() && selectedSet === "all") {
      setError("Veuillez sélectionner un set ou entrer un nom de carte")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Mettre à jour l'URL avec les paramètres de recherche
      const params = new URLSearchParams()
      if (searchTerm.trim()) {
        params.set("q", searchTerm)
      }
      params.set("set", selectedSet)
      params.set("condition", selectedCondition)
      router.push(`/?${params.toString()}`, { scroll: false })

      console.log('🔍 Recherche avec les paramètres:', {
        searchTerm: searchTerm.trim(),
        selectedSet,
        selectedCondition
      })

      const cards = await PokemonTCGService.searchCards(searchTerm.trim(), {
        set: selectedSet !== "all" ? selectedSet : undefined,
        forceSet: !searchTerm.trim() // Nouveau paramètre pour forcer la recherche par set
      })

      console.log('📦 Cartes trouvées:', cards.length, cards)

      const cardsWithPredictions = await Promise.all(cards.map(async card => {
        console.log('🎴 Traitement de la carte:', {
          name: card.name,
          set: card.set,
          number: card.number,
          prices: card.prices,
          marketPrices: card.marketPrices
        })

        // Déterminer la variante en fonction des prix disponibles
        let variant: CardVariant | undefined
        if (card.prices.market) {
          variant = "normal"
        } else if (card.tcgplayer?.prices?.holofoil?.market) {
          variant = "holo"
        } else if (card.tcgplayer?.prices?.reverseHolofoil?.market) {
          variant = "reverse"
        }

        // Si aucune variante n'est trouvée, on ignore cette carte
        if (!variant) {
          console.log('❌ Aucune variante trouvée pour la carte:', card.name)
          return null
        }

        const conditionMultiplier = CONDITION_MULTIPLIERS[selectedCondition]
        const basePrice = card.prices.market
        const adjustedPrice = basePrice * conditionMultiplier

        console.log('💰 Prix ajustés:', {
          variant,
          condition: selectedCondition,
          basePrice,
          conditionMultiplier,
          adjustedPrice
        })

        const priceHistory = card.marketPrices 
          ? [
              card.marketPrices.avg1,
              card.marketPrices.avg7,
              card.marketPrices.avg30,
              card.marketPrices.trendPrice
            ].map((price, index) => ({
              timestamp: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
              price: price * conditionMultiplier
            }))
          : [{
              timestamp: new Date().toISOString(),
              price: adjustedPrice
            }]

        console.log('📈 Historique des prix:', priceHistory)

        const prediction = await PricePredictionService.predictPrice(priceHistory)
        console.log('🔮 Prédiction brute:', prediction)

        const rarityMultiplier = card.rarity?.toLowerCase()?.includes("rare") ? 1.1 : 1
        const trendMultiplier = card.marketPrices?.trendPrice && card.marketPrices?.avg30
          ? (card.marketPrices.trendPrice / card.marketPrices.avg30)
          : 1

        console.log('📊 Multiplicateurs:', {
          rarity: rarityMultiplier,
          trend: trendMultiplier
        })

        const adjustedPrediction = prediction.predictedPrice * rarityMultiplier * trendMultiplier
        console.log('🎯 Prédiction finale:', adjustedPrediction)

        return {
          ...card,
          variant,
          condition: selectedCondition,
          prices: {
            market: adjustedPrice,
            low: card.prices.low * conditionMultiplier,
            mid: card.prices.mid * conditionMultiplier,
            high: card.prices.high * conditionMultiplier
          },
          prediction: {
            ...prediction,
            predictedPrice: adjustedPrediction
          }
        }
      }))

      const results = cardsWithPredictions.filter(card => card !== null) as PokemonCard[]
      console.log('✨ Résultats finaux:', results)
      setSearchResults(results)
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error)
      setError("Une erreur est survenue lors de la recherche")
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction de tri des résultats
  const getSortedResults = (results: PokemonCard[]) => {
    // Filtrer d'abord les résultats en fonction du type de tri
    let filteredResults = [...results]
    
    // Pour les tris liés à l'investissement, on ne garde que les cartes > 5€
    if (["investment_score", "roi", "rsi_buy", "rsi_sell"].includes(sortBy)) {
      filteredResults = filteredResults.filter(card => card.prices.market >= 5)
    }

    return filteredResults.sort((a, b) => {
      switch (sortBy) {
        case "number": {
          // Fonction pour extraire le numéro et le suffixe d'une carte
          const parseCardNumber = (num: string) => {
            const match = num.match(/^(\d+)([a-zA-Z]*)/);
            if (!match) return { number: 0, suffix: '' };
            return {
              number: parseInt(match[1], 10),
              suffix: match[2].toLowerCase()
            };
          };

          const numA = parseCardNumber(a.number);
          const numB = parseCardNumber(b.number);

          // D'abord comparer les numéros
          if (numA.number !== numB.number) {
            return numA.number - numB.number;
          }
          
          // Si les numéros sont égaux, comparer les suffixes
          return numA.suffix.localeCompare(numB.suffix);
        }

        case "investment_score": {
          const scoreA = a.prediction.profitAnalysis.investmentScore * (a.prediction.metrics.technical.rsi < 30 ? 1.5 : 1)
          const scoreB = b.prediction.profitAnalysis.investmentScore * (b.prediction.metrics.technical.rsi < 30 ? 1.5 : 1)
          return scoreB - scoreA
        }

        case "roi": {
          const roiA = a.prediction.profitAnalysis.roi * (a.prediction.metrics.technical.rsi < 30 ? 1.5 : 1)
          const roiB = b.prediction.profitAnalysis.roi * (b.prediction.metrics.technical.rsi < 30 ? 1.5 : 1)
          return roiB - roiA
        }

        case "rsi_buy": {
          // Calcul d'un score d'achat basé sur plusieurs facteurs
          const getBuyScore = (card: PokemonCard) => {
            let score = 0
            // RSI bas = meilleur score
            if (card.prediction.metrics.technical.rsi < 30) score += 100
            else if (card.prediction.metrics.technical.rsi < 40) score += 50
            else if (card.prediction.metrics.technical.rsi < 50) score += 25
            
            // MACD positif = bonus
            if (card.prediction.metrics.technical.macd.histogram > 0) score += 30
            
            // Tendance à la hausse = bonus
            if (card.prediction.trend === 'up') score += 20
            
            // ROI élevé = bonus
            score += Math.min(card.prediction.profitAnalysis.roi / 2, 50)
            
            return score
          }
          
          return getBuyScore(b) - getBuyScore(a)
        }

        case "rsi_sell": {
          // Calcul d'un score de vente basé sur plusieurs facteurs
          const getSellScore = (card: PokemonCard) => {
            let score = 0
            // RSI haut = meilleur score
            if (card.prediction.metrics.technical.rsi > 70) score += 100
            else if (card.prediction.metrics.technical.rsi > 60) score += 50
            else if (card.prediction.metrics.technical.rsi > 50) score += 25
            
            // MACD négatif = bonus
            if (card.prediction.metrics.technical.macd.histogram < 0) score += 30
            
            // Tendance à la baisse = bonus
            if (card.prediction.trend === 'down') score += 20
            
            return score
          }
          
          return getSellScore(b) - getSellScore(a)
        }

        case "confidence":
          return b.prediction.confidence - a.prediction.confidence

        case "price_asc":
          return a.prices.market - b.prices.market

        case "price_desc":
          return b.prices.market - a.prices.market

        default:
          return 0
      }
    })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300
      }
    }
  }

  return (
    <motion.div 
      className="container mx-auto py-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Barre de recherche */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="space-y-4">
            {/* Première ligne : Input de recherche et bouton */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Rechercher une carte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading} className="min-w-[120px]">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Recherche...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <span>Rechercher</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Deuxième ligne : Filtres et tri */}
            <div className="flex flex-wrap gap-4">
              <Select value={selectedSet} onValueChange={setSelectedSet}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Sélectionner un set" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Tous</SelectLabel>
                    <SelectItem value="all">Tous les sets</SelectItem>
                  </SelectGroup>
                  {SERIES_ORDER.map(series => {
                    const seriesSets = groupSetsBySeries(sets)[series]
                    if (!seriesSets?.length) return null
                    
                    return (
                      <SelectGroup key={series}>
                        <SelectLabel>{series}</SelectLabel>
                        {seriesSets.map((set) => (
                          <SelectItem key={set.id} value={set.id}>
                            {set.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )
                  })}
                </SelectContent>
              </Select>

              <Select value={selectedCondition} onValueChange={(value: CardCondition) => setSelectedCondition(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="État" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>État</SelectLabel>
                    <SelectItem value="raw">Raw</SelectItem>
                    <SelectItem value="PSA 8">PSA 8</SelectItem>
                    <SelectItem value="PSA 9">PSA 9</SelectItem>
                    <SelectItem value="PSA 10">PSA 10</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Tri des résultats</SelectLabel>
                    {Object.entries(SORT_OPTIONS).map(([value, { label, description }]) => (
                      <SelectItem key={value} value={value}>
                        <div>
                          <div>{label}</div>
                          <div className="text-xs text-muted-foreground">{description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getSortedResults(searchResults).map((card, index) => (
            <motion.div
              key={`${card.id}-${card.variant}-${card.condition}`}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="overflow-hidden transition-shadow cursor-pointer"
                onClick={() => router.push(`/card/${card.id}`)}
              >
                <div className="relative aspect-[63/88]">
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                    unoptimized
                  />
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold truncate">{card.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {card.set} - {card.number.padStart(3, "0")}{card.number.match(/[a-zA-Z]+/)?.[0] || ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{card.rarity}</Badge>
                      <Badge variant="outline">{card.variant}</Badge>
                      <Badge variant="outline">{card.condition}</Badge>
                    </div>
                    <div className="pt-2 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-muted-foreground">Prix actuel</span>
                        <span className="text-lg font-semibold">
                          {card.prices.market.toFixed(2)}€
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-muted-foreground">Prix prédit</span>
                        <div className="text-right">
                          <span className="text-lg font-semibold">
                            {card.prediction.predictedPrice.toFixed(2)}€
                          </span>
                          {card.prediction.predictedPrice !== card.prices.market && (
                            <span className={`ml-2 text-sm ${
                              card.prediction.predictedPrice > card.prices.market 
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}>
                              {card.prediction.predictedPrice > card.prices.market ? '+' : ''}
                              {((card.prediction.predictedPrice - card.prices.market) / card.prices.market * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={card.prediction.confidence * 100} 
                        className="h-1.5"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Score: {(card.prediction.profitAnalysis.investmentScore || 0).toFixed(0)}/100</span>
                        <span>ROI: {((card.prediction.profitAnalysis.roi || 0) * 100).toFixed(1)}%</span>
                      </div>
                      {/* Indicateur RSI */}
                      <div className="flex items-center justify-between text-xs">
                        <Badge 
                          variant={
                            card.prediction.metrics.technical.rsi < 30 ? "default" : 
                            card.prediction.metrics.technical.rsi > 70 ? "destructive" : 
                            "secondary"
                          }
                          className="w-full justify-center"
                        >
                          {card.prediction.metrics.technical.rsi < 30 ? "Opportunité d'achat" :
                           card.prediction.metrics.technical.rsi > 70 ? "Risque de baisse" :
                           "RSI Neutre"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
} 