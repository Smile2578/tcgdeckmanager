import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://api.pokemontcg.io/v2'

type Props = {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: NextRequest,
  props: Props
) {
  try {
    const params = await props.params
    const id = params.id
    const searchParams = request.nextUrl.searchParams
    const apiUrl = `${API_BASE_URL}/cards/${id}?${searchParams.toString()}`

    const response = await fetch(apiUrl, {
      headers: {
        'X-Api-Key': process.env.POKEMON_TCG_API_KEY || ''
      }
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error getting card:", error)
    return NextResponse.json(
      { error: "Failed to fetch card data" },
      { status: 500 }
    )
  }
} 