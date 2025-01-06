import { NextResponse } from 'next/server'
import { EbayScraperService } from '@/services/ebay-scraper'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
})

const CACHE_TTL = 60 * 60 * 24 // 24 heures en secondes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const setName = searchParams.get('setName')
    const cardNumber = searchParams.get('cardNumber')

    if (!setName || !cardNumber) {
      return NextResponse.json(
        { error: 'setName et cardNumber sont requis' },
        { status: 400 }
      )
    }

    // Vérifier le cache
    const cacheKey = `ebay:${setName}:${cardNumber}`
    const cachedData = await redis.get(cacheKey)

    if (cachedData) {
      console.log('✅ Données récupérées depuis le cache')
      return NextResponse.json(cachedData)
    }

    // Si pas en cache, récupérer les données
    console.log('🔍 Récupération des données depuis PokeData.io')
    const sales = await EbayScraperService.getSales(setName, cardNumber)
    const analysis = await EbayScraperService.analyzePrices(sales)

    const data = { analysis }

    // Mettre en cache
    await redis.set(cacheKey, data, { ex: CACHE_TTL })

    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    )
  }
} 