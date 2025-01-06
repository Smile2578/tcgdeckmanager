"use client"

import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { TrendingUpIcon, TrendingDownIcon, ArrowRightIcon, ArrowLeftIcon, InfoIcon } from "lucide-react"
import { motion } from "framer-motion"
import { clsx } from "clsx"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { PricePrediction } from "@/services/price-prediction"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"
import { PokeDataAnalysis } from './pokedata-analysis'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PokemonCard {
  id: string
  name: string
  image: string
  rarity: string
  set: string
  setId: string
  number: string
  variant: string
  condition: string
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

interface CardDetailsProps {
  card: PokemonCard
}

const METRIC_TOOLTIPS = {
  predictedPrice: "Notre modèle analyse l'historique des prix, les tendances du marché et les indicateurs techniques pour prédire le prix futur. La prédiction est basée sur les données du marché international (US).",
  confidence: "La confiance indique la fiabilité de notre prédiction. Une confiance élevée (>70%) signifie que les indicateurs sont cohérents et que le marché est stable. Une faible confiance (<30%) indique un marché incertain ou des données limitées.",
  volatility: "La volatilité mesure l'amplitude des variations de prix. Une volatilité élevée (>50%) indique des changements de prix importants et fréquents, suggérant un marché instable. Une faible volatilité (<20%) indique un prix stable.",
  rsi: "Le RSI (Relative Strength Index) mesure si une carte est surachetée ou survendue. Un RSI > 70 indique une carte potentiellement surachetée (risque de baisse), tandis qu'un RSI < 30 indique une carte potentiellement survendue (opportunité d'achat).",
  macd: "Le MACD compare les moyennes mobiles courtes et longues des prix. Un histogramme positif suggère une tendance haussière (bon moment pour acheter), négatif une tendance baissière (attendre avant d'acheter).",
  profitPotential: "Analyse du potentiel de profit basée sur plusieurs facteurs : prix actuel, profit attendu, RSI, tendance et niveau de risque. Un score élevé indique une meilleure opportunité d'investissement."
}

export function CardDetails({ card }: CardDetailsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [openTooltips, setOpenTooltips] = useState<Record<string, boolean>>({})

  const formatPrice = (price: number | undefined | null) => 
    price ? `${price.toFixed(2)}€` : "N/A"
  const formatPercent = (value: number | undefined | null) => 
    value ? `${value.toFixed(1)}%` : "N/A"

  const getTrendIcon = (value: number | undefined | null) => {
    if (!value) return <ArrowRightIcon className="w-4 h-4 text-yellow-500" />
    if (value > 0) return <TrendingUpIcon className="w-4 h-4 text-green-500" />
    if (value < 0) return <TrendingDownIcon className="w-4 h-4 text-red-500" />
    return <ArrowRightIcon className="w-4 h-4 text-yellow-500" />
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  // Vérifier si nous avons des données de prédiction valides
  const hasPrediction = card.prediction?.predictedPrice && !isNaN(card.prediction.predictedPrice)
  const hasMetrics = card.prediction?.metrics?.temporal && card.prediction?.metrics?.technical

  // Inverser l'ordre des données pour le graphique
  const sortedPriceHistory = [...card.prediction.priceHistory].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  // Ajouter l'analyse de l'opportunité d'achat
  const getBuyRecommendation = () => {
    const { rsi, macd, volatility } = card.prediction.metrics.technical
    const confidence = card.prediction.confidence
    const weekChange = card.prediction.metrics.temporal.week.change
    
    if (confidence < 0.3) {
      return {
        recommendation: "Données insuffisantes",
        explanation: "Pas assez de données pour une recommandation fiable",
        color: "text-yellow-500"
      }
    }

    // RSI très bas (survendu) = opportunité d'achat potentielle
    if (rsi < 30) {
      if (weekChange > 0 || macd.histogram > 0) {
        return {
          recommendation: "Achat recommandé",
          explanation: "RSI très bas avec signes de reprise",
          color: "text-green-500"
        }
      } else {
        return {
          recommendation: "Attendre",
          explanation: "RSI bas mais tendance encore baissière",
          color: "text-yellow-500"
        }
      }
    }

    // RSI très haut (suracheté) = risque de baisse
    if (rsi > 70) {
      return {
        recommendation: "Vente recommandée",
        explanation: "RSI élevé indique une surévaluation",
        color: "text-red-500"
      }
    }

    if (volatility > 0.5) {
      return {
        recommendation: "Prudence",
        explanation: "Marché très volatil, risque élevé",
        color: "text-yellow-500"
      }
    }

    // RSI neutre, on regarde la tendance MACD
    if (macd.histogram > 0 && weekChange > 0) {
      return {
        recommendation: "Achat possible",
        explanation: "Tendance haussière confirmée",
        color: "text-green-500"
      }
    }

    if (macd.histogram < 0 && weekChange < 0) {
      return {
        recommendation: "Attendre",
        explanation: "Tendance baissière confirmée",
        color: "text-red-500"
      }
    }

    return {
      recommendation: "Neutre",
      explanation: "Pas de signal fort",
      color: "text-blue-500"
    }
  }

  const buyRecommendation = getBuyRecommendation()

  const handleTooltipClick = (tooltipId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setOpenTooltips(prev => ({
      ...prev,
      [tooltipId]: !prev[tooltipId]
    }))
  }

  const handleBackClick = () => {
    // Si on a des paramètres de recherche, on retourne à la recherche
    if (searchParams && searchParams.toString()) {
      router.push(`/?${searchParams.toString()}`)
    } else {
      // Sinon on retourne à la page d'accueil
      router.push('/')
    }
  }

  return (
    <motion.div 
      className="container mx-auto py-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackClick}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Retour à la recherche
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche: Image et infos de base */}
        <motion.div variants={itemVariants}>
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{card.name}</CardTitle>
              <CardDescription>
                {card.set} - #{card.number}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div 
                className="relative aspect-[63/88] w-full"
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  className="rounded-lg shadow-lg object-contain"
                  priority
                  quality={100}
                  unoptimized
                />
              </motion.div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{card.rarity}</Badge>
                {card.variant && <Badge variant="outline">{card.variant}</Badge>}
                {card.condition && <Badge variant="outline">{card.condition}</Badge>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Colonne de droite: Prix et analyses */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Tabs defaultValue="pokemontcg" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pokemontcg">Pokemon TCG (Cardmarket)</TabsTrigger>
              <TabsTrigger value="pokedata">PokeData (eBay)</TabsTrigger>
            </TabsList>

            <TabsContent value="pokemontcg">
              {hasPrediction && hasMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Analyse du prix</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Prix prédit */}
                    <motion.div 
                      className="space-y-2"
                    >
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Prix prédit (US)</h3>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip open={openTooltips['predictedPrice']}>
                              <TooltipTrigger asChild>
                                <InfoIcon 
                                  className="w-4 h-4 text-muted-foreground cursor-help" 
                                  onClick={(e) => handleTooltipClick('predictedPrice', e)}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs p-2">
                                <p>{METRIC_TOOLTIPS.predictedPrice}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(card.prediction.metrics.temporal.week.change)}
                          <span className="text-2xl font-bold">
                            {formatPrice(card.prediction.predictedPrice)}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={card.prediction.confidence * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Confiance: {formatPercent(card.prediction.confidence * 100)}</span>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip open={openTooltips['confidence']}>
                              <TooltipTrigger asChild>
                                <InfoIcon 
                                  className="w-3 h-3 cursor-help" 
                                  onClick={(e) => handleTooltipClick('confidence', e)}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs p-2">
                                <p>{METRIC_TOOLTIPS.confidence}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Volatilité: {formatPercent(card.prediction.metrics.technical.volatility * 100)}</span>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip open={openTooltips['volatility']}>
                              <TooltipTrigger asChild>
                                <InfoIcon 
                                  className="w-3 h-3 cursor-help" 
                                  onClick={(e) => handleTooltipClick('volatility', e)}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs p-2">
                                <p>{METRIC_TOOLTIPS.volatility}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className={clsx("mt-4 p-3 rounded-lg border", buyRecommendation.color)}>
                        <div className="font-semibold">{buyRecommendation.recommendation}</div>
                        <div className="text-sm">{buyRecommendation.explanation}</div>
                      </div>
                    </motion.div>

                    <Separator />

                    {/* Métriques temporelles */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {Object.entries({
                        "24h": card.prediction.metrics.temporal.day,
                        "7j": card.prediction.metrics.temporal.week,
                        "30j": card.prediction.metrics.temporal.month,
                        "Depuis sortie": card.prediction.metrics.temporal.allTime
                      }).map(([period, metrics]) => (
                        <Card key={period}>
                          <CardHeader className="p-4">
                            <CardTitle className="text-sm flex items-center justify-between">
                              {period}
                              <Badge variant={metrics.change > 0 ? "default" : metrics.change < 0 ? "destructive" : "secondary"}>
                                {formatPercent(metrics.change)}
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Min</span>
                                <span className="font-medium">{formatPrice(metrics.min)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Moy</span>
                                <span className="font-medium">{formatPrice(metrics.avg)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Max</span>
                                <span className="font-medium">{formatPrice(metrics.max)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Separator />

                    {/* Indicateurs techniques */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">RSI</CardTitle>
                            <TooltipProvider delayDuration={0}>
                              <Tooltip open={openTooltips['rsi']}>
                                <TooltipTrigger asChild>
                                  <InfoIcon 
                                    className="w-4 h-4 text-muted-foreground cursor-help" 
                                    onClick={(e) => handleTooltipClick('rsi', e)}
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs p-2">
                                  <p>{METRIC_TOOLTIPS.rsi}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={clsx(
                                "text-xl font-semibold",
                                card.prediction.metrics.technical.rsi < 30 && "text-green-500",
                                card.prediction.metrics.technical.rsi > 70 && "text-red-500"
                              )}>
                                {card.prediction.metrics.technical.rsi.toFixed(1)}
                              </span>
                              <Badge variant={card.prediction.metrics.technical.rsi < 30 ? "default" : 
                                     card.prediction.metrics.technical.rsi > 70 ? "destructive" : "secondary"}>
                                {card.prediction.metrics.technical.rsi < 30 ? "Survendu (opportunité)" : 
                                 card.prediction.metrics.technical.rsi > 70 ? "Suracheté (risque)" : "Neutre"}
                              </Badge>
                            </div>
                            <Progress 
                              value={card.prediction.metrics.technical.rsi} 
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground">
                              {card.prediction.metrics.technical.rsi < 30 
                                ? "Prix potentiellement sous-évalué" 
                                : card.prediction.metrics.technical.rsi > 70 
                                ? "Prix potentiellement surévalué"
                                : "Prix dans la zone normale"}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">MACD</CardTitle>
                            <TooltipProvider delayDuration={0}>
                              <Tooltip open={openTooltips['macd']}>
                                <TooltipTrigger asChild>
                                  <InfoIcon 
                                    className="w-4 h-4 text-muted-foreground cursor-help" 
                                    onClick={(e) => handleTooltipClick('macd', e)}
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs p-2">
                                  <p>{METRIC_TOOLTIPS.macd}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={clsx(
                                "text-xl font-semibold",
                                card.prediction.metrics.technical.macd.histogram > 0 && "text-green-500",
                                card.prediction.metrics.technical.macd.histogram < 0 && "text-red-500"
                              )}>
                                {card.prediction.metrics.technical.macd.histogram.toFixed(3)}
                              </span>
                              <Badge variant={card.prediction.metrics.technical.macd.histogram > 0 ? "default" : "destructive"}>
                                {Math.abs(card.prediction.metrics.technical.macd.histogram) < 0.001 
                                  ? "Pas de tendance claire"
                                  : card.prediction.metrics.technical.macd.histogram > 0 
                                  ? "Tendance haussière" 
                                  : "Tendance baissière"}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Signal: {card.prediction.metrics.technical.macd.signal.toFixed(3)}</span>
                              <span>Valeur: {card.prediction.metrics.technical.macd.value.toFixed(3)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator />

                    {/* Analyse du potentiel de profit */}
                    <div className="space-y-4">
                      <Card>
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Potentiel d&apos;investissement</CardTitle>
                            <TooltipProvider delayDuration={0}>
                              <Tooltip open={openTooltips['profitPotential']}>
                                <TooltipTrigger asChild>
                                  <InfoIcon 
                                    className="w-4 h-4 text-muted-foreground cursor-help" 
                                    onClick={(e) => handleTooltipClick('profitPotential', e)}
                                  />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs p-2">
                                  <p>{METRIC_TOOLTIPS.profitPotential}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-4">
                            {/* Score d'investissement */}
                            <div>
                              <div className="flex justify-between items-baseline mb-2">
                                <span className="text-sm text-muted-foreground">Score d&apos;investissement</span>
                                <span className="text-xl font-semibold">
                                  {card.prediction.profitAnalysis.investmentScore.toFixed(1)}/100
                                </span>
                              </div>
                              <Progress 
                                value={card.prediction.profitAnalysis.investmentScore} 
                                className="h-2"
                              />
                            </div>

                            {/* Profit attendu et ROI */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-muted-foreground">Profit attendu</span>
                                <div className={clsx(
                                  "text-lg font-semibold",
                                  card.prediction.profitAnalysis.expectedProfit > 0 ? "text-green-500" : "text-red-500"
                                )}>
                                  {card.prediction.profitAnalysis.expectedProfit.toFixed(2)}€
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">ROI</span>
                                <div className={clsx(
                                  "text-lg font-semibold",
                                  card.prediction.profitAnalysis.roi > 0 ? "text-green-500" : "text-red-500"
                                )}>
                                  {card.prediction.profitAnalysis.roi.toFixed(1)}%
                                </div>
                              </div>
                            </div>

                            {/* Niveau de risque et temps estimé */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm text-muted-foreground">Niveau de risque</span>
                                <div>
                                  <Badge variant={
                                    card.prediction.profitAnalysis.riskLevel === 'low' ? "default" :
                                    card.prediction.profitAnalysis.riskLevel === 'medium' ? "secondary" :
                                    "destructive"
                                  }>
                                    {card.prediction.profitAnalysis.riskLevel === 'low' ? "Faible" :
                                     card.prediction.profitAnalysis.riskLevel === 'medium' ? "Moyen" :
                                     "Élevé"}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Temps estimé</span>
                                <div className="font-semibold">
                                  {card.prediction.profitAnalysis.timeToProfit} jours
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Graphique */}
                    {sortedPriceHistory.length > 0 && (
                      <motion.div variants={itemVariants}>
                        <Card>
                          <CardHeader className="p-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">Historique des prix</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  Du {new Date(sortedPriceHistory[0].timestamp).toLocaleDateString()}
                                </Badge>
                                <Badge variant="outline">
                                  au {new Date(sortedPriceHistory[sortedPriceHistory.length - 1].timestamp).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sortedPriceHistory}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="timestamp" 
                                    tickFormatter={(timestamp) => {
                                      const date = new Date(timestamp)
                                      return isNaN(date.getTime()) ? "" : date.toLocaleDateString()
                                    }}
                                  />
                                  <YAxis domain={['auto', 'auto']} />
                                  <RechartsTooltip 
                                    formatter={(value) => formatPrice(Number(value))}
                                    labelFormatter={(timestamp) => {
                                      const date = new Date(timestamp)
                                      return isNaN(date.getTime()) ? "" : date.toLocaleDateString()
                                    }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#2563eb"
                                    strokeWidth={2}
                                    dot={{ strokeWidth: 2 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pokedata">
              <PokeDataAnalysis 
                setName={card.set} 
                cardNumber={card.number} 
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  )
} 