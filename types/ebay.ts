export interface EbaySale {
  listingId: string
  price: number
  dateSold: string
  isAuction: boolean
  bids?: number
  condition: string
  title: string
  grade: string
}

export interface TimeFrameAnalysis {
  averagePrice: number
  minPrice: number
  maxPrice: number
  salesCount: number
  trend: number
  priceHistory: Array<{
    date: string
    price: number
  }>
}

interface PriceDistribution {
  standardDeviation: number
  median: number
  mode: number
  quartiles: {
    q1: number
    q2: number
    q3: number
  }
}

interface AuctionAnalysis {
  auctionPercentage: number
  averageBids: number
  auctionPriceDifference: number
  bidDistribution: {
    min: number
    max: number
    average: number
  }
}

export interface PriceAnalysis {
  averagePrice: number
  minPrice: number
  maxPrice: number
  trend: number
  recentSales: EbaySale[]
  timeFrames: {
    '24h': TimeFrameAnalysis
    '7d': TimeFrameAnalysis
    '30d': TimeFrameAnalysis
    '90d': TimeFrameAnalysis
    '1y': TimeFrameAnalysis
    'all': TimeFrameAnalysis
  }
  priceDistribution: PriceDistribution
  auctionAnalysis: AuctionAnalysis
}

export interface EbayPriceAnalysis {
  raw: PriceAnalysis
  psa8: PriceAnalysis
  psa9: PriceAnalysis
  psa10: PriceAnalysis
} 