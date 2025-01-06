import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.NEXT_PUBLIC_POKEMON_TCG_API_KEY
const API_BASE_URL = "https://api.pokemontcg.io/v2"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const apiUrl = `${API_BASE_URL}/cards?${searchParams.toString()}`

    const response = await fetch(apiUrl, {
      headers: {
        'X-Api-Key': API_KEY || '',
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error searching cards:', error)
    return NextResponse.json(
      { error: 'Failed to search cards' },
      { status: 500 }
    )
  }
} 