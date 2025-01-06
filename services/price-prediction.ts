interface PricePoint {
  timestamp: string
  price: number
  volume?: number
}

interface PeriodMetrics {
  avg: number
  min: number
  max: number
  change: number
  volume: number
}

interface TemporalMetrics {
  current: number
  day: PeriodMetrics
  week: PeriodMetrics
  month: PeriodMetrics
  allTime: PeriodMetrics
}

interface ProfitAnalysis {
  expectedProfit: number
  roi: number
  investmentScore: number
  riskLevel: 'low' | 'medium' | 'high'
  timeToProfit: number
}

export interface PricePrediction {
  predictedPrice: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  trendStrength: number
  volatility: number
  priceHistory: PricePoint[]
  profitAnalysis: ProfitAnalysis
  metrics: {
    temporal: TemporalMetrics
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

export class PricePredictionService {
  static async predictPrice(priceHistory: PricePoint[]): Promise<PricePrediction> {
    try {
      // Calcul des métriques de base
      const prices = priceHistory.map(p => p.price)
      const currentPrice = prices[0] || 0
      
      // Calcul de la volatilité (écart-type des variations en %)
      const priceChanges = prices.slice(1).map((price, i) => 
        ((price - prices[i]) / prices[i]) * 100
      )
      const volatility = priceChanges.length > 0 
        ? Math.sqrt(priceChanges.reduce((sum, change) => sum + change * change, 0) / priceChanges.length)
        : 0

      // Calcul du RSI
      const rsiPeriod = Math.min(14, prices.length - 1)
      const gains = []
      const losses = []
      for (let i = 1; i <= rsiPeriod; i++) {
        const change = prices[i-1] - prices[i]
        if (change >= 0) {
          gains.push(change)
          losses.push(0)
        } else {
          gains.push(0)
          losses.push(-change)
        }
      }
      const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / rsiPeriod
      const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / rsiPeriod
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
      const rsi = 100 - (100 / (1 + rs))

      // Calcul du MACD
      const ema12 = this.calculateEMA(prices, 12)
      const ema26 = this.calculateEMA(prices, 26)
      const macdLine = ema12 - ema26
      const signalLine = this.calculateEMA([macdLine], 9)
      const macdHistogram = macdLine - signalLine

      // Analyse de la tendance
      const trend = this.analyzeTrend(prices)
      const trendStrength = this.calculateTrendStrength(prices)

      // Calcul du prix prédit
      const predictedPrice = this.calculatePredictedPrice(prices, {
        rsi,
        macdHistogram,
        trend,
        trendStrength,
        volatility
      })

      // Calcul de la confiance
      const confidence = this.calculateConfidence({
        priceHistory,
        volatility,
        trendStrength,
        rsi
      })

      // Analyse de profit
      const profitAnalysis = this.analyzeProfitPotential({
        currentPrice,
        predictedPrice,
        rsi,
        confidence,
        volatility,
        trend,
        trendStrength
      })

      // Métriques temporelles
      const temporal = this.calculateTemporalMetrics(priceHistory)

      return {
        predictedPrice,
        confidence,
        trend,
        trendStrength,
        volatility,
        priceHistory: priceHistory.map(p => ({
          timestamp: p.timestamp,
          price: p.price,
          volume: p.volume
        })),
        profitAnalysis,
        metrics: {
          temporal,
          technical: {
            rsi,
            momentum: trendStrength,
            volatility,
            macd: {
              value: macdLine,
              signal: signalLine,
              histogram: macdHistogram
            },
            bollingerBands: this.calculateBollingerBands(prices)
          },
          seasonality: this.analyzeSeasonality()
        }
      }
    } catch (error) {
      console.error("Erreur lors de la prédiction:", error)
      return this.getDefaultPrediction(priceHistory[0]?.price || 0)
    }
  }

  static async predictPriceWithEbay(
    cardmarketHistory: PricePoint[],
    ebayData: {
      raw: { averagePrice: number; trend: number }
      psa8: { averagePrice: number; trend: number }
      psa9: { averagePrice: number; trend: number }
      psa10: { averagePrice: number; trend: number }
    }
  ): Promise<PricePrediction> {
    // D'abord, obtenir la prédiction basée sur Cardmarket
    const cardmarketPrediction = await this.predictPrice(cardmarketHistory)

    // Ajuster la prédiction en fonction des données eBay
    const rawEbayPrice = ebayData.raw.averagePrice
    const cardmarketPrice = cardmarketPrediction.predictedPrice

    // Calculer un ratio entre les prix eBay et Cardmarket
    const priceRatio = rawEbayPrice / cardmarketPrice

    // Ajuster la prédiction en fonction du ratio
    const adjustedPrediction = {
      ...cardmarketPrediction,
      predictedPrice: cardmarketPrediction.predictedPrice * (1 + ((priceRatio - 1) * 0.5)),
      confidence: cardmarketPrediction.confidence * 1.2, // Augmenter la confiance car nous avons deux sources
    }

    // Ajuster la confiance si les tendances sont similaires
    if (
      (ebayData.raw.trend > 0 && cardmarketPrediction.trend === 'up') ||
      (ebayData.raw.trend < 0 && cardmarketPrediction.trend === 'down')
    ) {
      adjustedPrediction.confidence = Math.min(1, adjustedPrediction.confidence * 1.2)
    }

    // Recalculer l'analyse de profit avec le nouveau prix prédit
    adjustedPrediction.profitAnalysis = this.analyzeProfitPotential({
      currentPrice: cardmarketHistory[0]?.price || 0,
      predictedPrice: adjustedPrediction.predictedPrice,
      rsi: cardmarketPrediction.metrics.technical.rsi,
      confidence: adjustedPrediction.confidence,
      volatility: cardmarketPrediction.metrics.technical.volatility,
      trend: cardmarketPrediction.trend,
      trendStrength: cardmarketPrediction.trendStrength
    })

    return adjustedPrediction
  }

  private static calculatePredictedPrice(
    prices: number[],
    metrics: { rsi: number; macdHistogram: number; trend: string; trendStrength: number; volatility: number }
  ): number {
    const currentPrice = prices[0] || 0
    let multiplier = 1.0

    // Ajustement basé sur le RSI
    if (metrics.rsi < 30) multiplier *= 1.15  // Sous-évalué, probable hausse
    else if (metrics.rsi > 70) multiplier *= 0.85  // Surévalué, probable baisse

    // Ajustement basé sur le MACD
    if (metrics.macdHistogram > 0) multiplier *= 1.1
    else if (metrics.macdHistogram < 0) multiplier *= 0.9

    // Ajustement basé sur la tendance
    if (metrics.trend === 'up') multiplier *= (1 + metrics.trendStrength * 0.2)
    else if (metrics.trend === 'down') multiplier *= (1 - metrics.trendStrength * 0.2)

    // Ajustement basé sur la volatilité
    const volatilityImpact = Math.min(metrics.volatility * 0.01, 0.2)
    multiplier *= (1 + volatilityImpact)

    return currentPrice * multiplier
  }

  private static calculateConfidence(params: {
    priceHistory: PricePoint[]
    volatility: number
    trendStrength: number
    rsi: number
  }): number {
    let confidence = 0.5  // Base de 50%

    // Plus de données = plus de confiance
    confidence += Math.min(params.priceHistory.length / 100, 0.2)

    // Forte tendance = plus de confiance
    confidence += params.trendStrength * 0.2

    // Volatilité réduit la confiance
    confidence -= Math.min(params.volatility * 0.01, 0.2)

    // RSI extrême réduit légèrement la confiance
    if (params.rsi < 30 || params.rsi > 70) {
      confidence -= 0.1
    }

    return Math.max(0, Math.min(1, confidence))
  }

  private static analyzeProfitPotential(params: {
    currentPrice: number
    predictedPrice: number
    rsi: number
    confidence: number
    volatility: number
    trend: string
    trendStrength: number
  }): ProfitAnalysis {
    const expectedProfit = params.predictedPrice - params.currentPrice
    const roi = expectedProfit / params.currentPrice

    // Calcul du score d'investissement
    let score = 0

    // Composante ROI (max 40 points)
    score += Math.min(roi * 100, 40)

    // Composante RSI (max 20 points)
    if (params.rsi < 30) score += 20
    else if (params.rsi < 40) score += 10
    else if (params.rsi > 70) score -= 10

    // Composante tendance (max 20 points)
    if (params.trend === 'up') score += params.trendStrength * 20

    // Composante confiance (max 20 points)
    score += params.confidence * 20

    // Ajustement final
    score = Math.max(0, Math.min(100, score))

    // Estimation du temps nécessaire
    const timeToProfit = Math.ceil(30 + (params.volatility * 2))

    // Niveau de risque
    let riskLevel: 'low' | 'medium' | 'high'
    if (params.volatility < 10 && params.confidence > 0.7) riskLevel = 'low'
    else if (params.volatility > 20 || params.confidence < 0.4) riskLevel = 'high'
    else riskLevel = 'medium'

    return {
      expectedProfit,
      roi,
      investmentScore: score,
      riskLevel,
      timeToProfit
    }
  }

  private static calculateTemporalMetrics(priceHistory: PricePoint[]): TemporalMetrics {
    const now = new Date()
    const day = 24 * 60 * 60 * 1000
    const week = 7 * day
    const month = 30 * day

    const getMetricsForPeriod = (points: PricePoint[]) => {
      if (points.length === 0) return null
      const prices = points.map(p => p.price)
      const volumes = points.map(p => p.volume || 0)
      
      // Le prix le plus récent est le premier de la liste
      const currentPrice = prices[0]
      // Le prix le plus ancien est le dernier de la liste
      const oldestPrice = prices[prices.length - 1]
      
      // Calcul de la variation en pourcentage
      // Une variation positive signifie que le prix a augmenté
      const change = oldestPrice !== 0 
        ? ((currentPrice - oldestPrice) / oldestPrice) * 100 
        : 0

      return {
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        min: Math.min(...prices),
        max: Math.max(...prices),
        change,
        volume: volumes.reduce((a, b) => a + b, 0)
      }
    }

    // Filtrer l'historique par période, du plus récent au plus ancien
    const last24h = priceHistory
      .filter(p => new Date(p.timestamp).getTime() > now.getTime() - day)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const last7d = priceHistory
      .filter(p => new Date(p.timestamp).getTime() > now.getTime() - week)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const last30d = priceHistory
      .filter(p => new Date(p.timestamp).getTime() > now.getTime() - month)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Trier tout l'historique par date
    const allTimeData = [...priceHistory].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return {
      current: priceHistory[0]?.price || 0,
      day: getMetricsForPeriod(last24h) || this.getDefaultPeriodMetrics(),
      week: getMetricsForPeriod(last7d) || this.getDefaultPeriodMetrics(),
      month: getMetricsForPeriod(last30d) || this.getDefaultPeriodMetrics(),
      allTime: getMetricsForPeriod(allTimeData) || this.getDefaultPeriodMetrics()
    }
  }

  private static getDefaultPeriodMetrics(): PeriodMetrics {
    return {
      avg: 0,
      min: 0,
      max: 0,
      change: 0,
      volume: 0
    }
  }

  private static getDefaultPrediction(currentPrice: number): PricePrediction {
    return {
      predictedPrice: currentPrice,
      confidence: 0,
      trend: 'stable',
      trendStrength: 0,
      volatility: 0,
      priceHistory: [],
      profitAnalysis: {
        expectedProfit: 0,
        roi: 0,
        investmentScore: 0,
        riskLevel: 'medium',
        timeToProfit: 30
      },
      metrics: {
        temporal: {
          current: currentPrice,
          day: this.getDefaultPeriodMetrics(),
          week: this.getDefaultPeriodMetrics(),
          month: this.getDefaultPeriodMetrics(),
          allTime: this.getDefaultPeriodMetrics()
        },
        technical: {
          rsi: 50,
          momentum: 0,
          volatility: 0,
          macd: {
            value: 0,
            signal: 0,
            histogram: 0
          },
          bollingerBands: {
            upper: currentPrice,
            middle: currentPrice,
            lower: currentPrice
          }
        },
        seasonality: {
          detected: false,
          period: null,
          strength: 0,
          nextPeak: null,
          nextTrough: null
        }
      }
    }
  }

  // Fonctions utilitaires existantes...
  private static calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0
    const multiplier = 2 / (period + 1)
    let ema = prices[0]
    
    for (let i = 1; i < Math.min(prices.length, period); i++) {
      ema = (prices[i] - ema) * multiplier + ema
    }
    
    return ema
  }

  private static analyzeTrend(prices: number[]): 'up' | 'down' | 'stable' {
    if (prices.length < 2) return 'stable'
    
    const recentAvg = prices.slice(0, 3).reduce((a, b) => a + b, 0) / 3
    const oldAvg = prices.slice(-3).reduce((a, b) => a + b, 0) / 3
    
    const changePct = ((recentAvg - oldAvg) / oldAvg) * 100
    
    if (changePct > 5) return 'up'
    if (changePct < -5) return 'down'
    return 'stable'
  }

  private static calculateTrendStrength(prices: number[]): number {
    if (prices.length < 2) return 0
    
    const changes = prices.slice(1).map((price, i) => 
      ((price - prices[i]) / prices[i]) * 100
    )
    
    const avgChange = changes.reduce((a, b) => a + Math.abs(b), 0) / changes.length
    return Math.min(avgChange / 10, 1)  // Normalise entre 0 et 1
  }

  private static calculateBollingerBands(prices: number[]): {
    upper: number
    middle: number
    lower: number
  } {
    if (prices.length === 0) return { upper: 0, middle: 0, lower: 0 }
    
    const period = 20
    const stdDev = 2
    
    const sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
    
    const squaredDiffs = prices.slice(0, period).map(price => 
      Math.pow(price - sma, 2)
    )
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period
    const standardDeviation = Math.sqrt(variance)
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    }
  }

  private static analyzeSeasonality(): {
    detected: boolean
    period: number | null
    strength: number
    nextPeak: string | null
    nextTrough: string | null
  } {
    // Implémentation de la détection de saisonnalité
    return {
      detected: false,
      period: null,
      strength: 0,
      nextPeak: null,
      nextTrough: null
    }
  }
} 