import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EbayPriceAnalysis, TimeFrameAnalysis } from '@/types/ebay'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"
import { TrendingUpIcon, TrendingDownIcon, ArrowRightIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PokemonTCGService } from '@/services/pokemon-tcg'

interface PokeDataAnalysisProps {
  setName: string
  cardNumber: string
}

interface PokeDataResponse {
  analysis: EbayPriceAnalysis
}

type TimeFrames = {
  '24h': TimeFrameAnalysis
  '7d': TimeFrameAnalysis
  '30d': TimeFrameAnalysis
  '90d': TimeFrameAnalysis
  '1y': TimeFrameAnalysis
  'all': TimeFrameAnalysis
}

const TIME_FRAMES = {
  '24h': '24 heures',
  '7d': '7 jours',
  '30d': '30 jours',
  '90d': '90 jours',
  '1y': '1 an',
  'all': 'Tout'
} as const

export function PokeDataAnalysis({ setName, cardNumber }: PokeDataAnalysisProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PokeDataResponse | null>(null)
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<keyof typeof TIME_FRAMES>('30d')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await PokemonTCGService.getPokeDataSales(setName, cardNumber)
        setData(result)
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error)
        setError("Impossible de charger les données PokeData")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [setName, cardNumber])

  const formatPrice = (price: number | undefined) => price ? `${price.toFixed(2)}€` : "N/A"
  const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR')
  const formatPercent = (value: number | undefined) => {
    if (value === undefined) return "N/A"
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getTrendIcon = (value: number | undefined) => {
    if (value === undefined) return <ArrowRightIcon className="w-4 h-4 text-yellow-500" />
    if (value > 0) return <TrendingUpIcon className="w-4 h-4 text-green-500" />
    if (value < 0) return <TrendingDownIcon className="w-4 h-4 text-red-500" />
    return <ArrowRightIcon className="w-4 h-4 text-yellow-500" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Chargement des données PokeData...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-destructive text-center">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { analysis } = data

  // Fonction utilitaire pour accéder en toute sécurité aux données
  const getTimeFrameData = (grade: 'raw' | 'psa8' | 'psa9' | 'psa10', timeFrame: keyof TimeFrames): TimeFrameAnalysis => {
    return analysis[grade]?.timeFrames?.[timeFrame] || {
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      salesCount: 0,
      trend: 0,
      priceHistory: []
    }
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse des ventes eBay via PokeData.io</CardTitle>
          <CardDescription>
            Données basées sur les ventes récentes sur eBay, fournies par PokeData.io
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['raw', 'psa8', 'psa9', 'psa10'] as const).map(grade => {
              const timeFrameData = getTimeFrameData(grade, '30d')
              return (
                <Card key={grade}>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">
                      {grade === 'raw' ? 'Non Gradée' : grade.toUpperCase()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-muted-foreground">Prix moyen</span>
                        <span className="text-xl font-bold">{formatPrice(analysis[grade]?.averagePrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Tendance 30j</span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(timeFrameData.trend)}
                          <Badge variant={timeFrameData.trend > 0 ? "default" : "destructive"}>
                            {formatPercent(timeFrameData.trend)}
                          </Badge>
                        </div>
                      </div>
                      <Progress 
                        value={50 + (timeFrameData.trend * 2)} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analyse détaillée par grade */}
      <Tabs defaultValue="raw" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="raw">Non Gradée</TabsTrigger>
          <TabsTrigger value="psa8">PSA 8</TabsTrigger>
          <TabsTrigger value="psa9">PSA 9</TabsTrigger>
          <TabsTrigger value="psa10">PSA 10</TabsTrigger>
        </TabsList>

        {(['raw', 'psa8', 'psa9', 'psa10'] as const).map(grade => {
          const timeFrameData = getTimeFrameData(grade, selectedTimeFrame)
          const gradeData = analysis[grade]

          if (!gradeData) {
            return (
              <TabsContent key={grade} value={grade}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      Aucune donnée disponible pour ce grade
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )
          }

          return (
            <TabsContent key={grade} value={grade} className="space-y-6">
              {/* Analyse temporelle */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Évolution du prix</CardTitle>
                    <div className="flex gap-2">
                      {Object.entries(TIME_FRAMES).map(([key, label]) => (
                        <Badge
                          key={key}
                          variant={selectedTimeFrame === key ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setSelectedTimeFrame(key as keyof typeof TIME_FRAMES)}
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Métriques de la période */}
                    <div className="grid grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm">Prix moyen</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold">
                            {formatPrice(timeFrameData.averagePrice)}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm">Volume</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="text-2xl font-bold">
                            {timeFrameData.salesCount}
                          </div>
                          <div className="text-sm text-muted-foreground">ventes</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm">Min/Max</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">
                              Min: {formatPrice(timeFrameData.minPrice)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Max: {formatPrice(timeFrameData.maxPrice)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm">Tendance</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center gap-2">
                            {getTrendIcon(timeFrameData.trend)}
                            <span className="text-2xl font-bold">
                              {formatPercent(timeFrameData.trend)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Graphique */}
                    {timeFrameData.priceHistory.length > 0 ? (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={timeFrameData.priceHistory}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="date" 
                                  tickFormatter={formatDate}
                                />
                                <YAxis domain={['auto', 'auto']} />
                                <RechartsTooltip
                                  formatter={(value: number) => formatPrice(value)}
                                  labelFormatter={formatDate}
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
                    ) : (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center text-muted-foreground">
                            Pas de données d&apos;historique disponibles pour cette période
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tableau des ventes récentes */}
              {gradeData.recentSales.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Historique des ventes</CardTitle>
                    <CardDescription>
                      30 dernières ventes triées par date
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Prix</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>État</TableHead>
                          <TableHead>Enchères</TableHead>
                          <TableHead>Lien</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gradeData.recentSales.map((sale) => (
                          <TableRow key={sale.listingId}>
                            <TableCell>{formatDate(sale.dateSold)}</TableCell>
                            <TableCell className="font-medium">{formatPrice(sale.price)}</TableCell>
                            <TableCell>
                              <Badge variant={sale.isAuction ? "secondary" : "outline"}>
                                {sale.isAuction ? "Enchère" : "Achat immédiat"}
                              </Badge>
                            </TableCell>
                            <TableCell>{sale.condition}</TableCell>
                            <TableCell>
                              {sale.isAuction && sale.bids !== undefined ? (
                                <Badge variant="secondary">
                                  {sale.bids} enchère{sale.bids > 1 ? 's' : ''}
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              <a 
                                href={`https://www.ebay.com/itm/${sale.listingId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                              >
                                Voir
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      Aucune vente récente disponible
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Statistiques avancées */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques avancées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm">Distribution des prix</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Écart-type</span>
                            <span>{formatPrice(gradeData.priceDistribution?.standardDeviation)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Médiane</span>
                            <span>{formatPrice(gradeData.priceDistribution?.median)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Mode</span>
                            <span>{formatPrice(gradeData.priceDistribution?.mode)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm">Analyse des enchères</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">% Enchères</span>
                            <span>{formatPercent(gradeData.auctionAnalysis?.auctionPercentage)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Moy. enchères</span>
                            <span>{gradeData.auctionAnalysis?.averageBids.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Diff. prix moyen</span>
                            <span>{formatPercent(gradeData.auctionAnalysis?.auctionPriceDifference)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
} 