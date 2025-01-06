import { NextResponse } from 'next/server'
import { PokeDataScraperService } from '@/services/pokedata-scraper'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
})

const CACHE_TTL = 60 * 60 * 24 // 24 heures en secondes

export async function GET(request: Request) {
  try {
    // Vérifier la clé API ScrapingBee
    if (!process.env.SCRAPING_BEE_API_KEY) {
      throw new Error('Clé API ScrapingBee non configurée')
    }

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
    const cacheKey = `pokedata:${setName}:${cardNumber}`
    const cachedData = await redis.get(cacheKey)

    if (cachedData) {
      console.log('✅ Données récupérées depuis le cache')
      return NextResponse.json(cachedData)
    }

    // Si pas en cache, scraper les données
    console.log('🔍 Scraping des données depuis PokeData.io')
    const analysis = await PokeDataScraperService.scrapeCard(setName, cardNumber)

    // Mettre en cache
    await redis.set(cacheKey, { analysis }, { ex: CACHE_TTL })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('❌ Erreur:', error)

    // Gérer les différents types d'erreurs
    if (error instanceof Error) {
      if (error.message.includes('ScrapingBee')) {
        return NextResponse.json(
          { error: 'Erreur lors du scraping des données', details: error.message },
          { status: 502 }
        )
      }
      if (error.message.includes('API')) {
        return NextResponse.json(
          { error: 'Clé API non configurée', details: error.message },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    )
  }
} 