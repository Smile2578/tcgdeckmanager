import { NextResponse } from 'next/server'

const API_KEY = process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY

export async function GET() {
  try {
    const response = await fetch(
      'https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&pageSize=250',
      {
        headers: {
          'X-Api-Key': API_KEY || '',
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching sets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sets' },
      { status: 500 }
    )
  }
} 