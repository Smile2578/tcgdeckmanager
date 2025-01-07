// Types
interface PokemonTCGResponse<T> {
  data: T
  page: number
  pageSize: number
  count: number
  totalCount: number
}

interface PokemonTCGSingleResponse<T> {
  data: T
}

interface TCGPlayerPrice {
  low: number
  mid: number
  high: number
  market: number
  directLow: number
}

interface SetInfo {
  id: string
  name: string
  series: string
  printedTotal: number
  total: number
  releaseDate: string
  updatedAt: string
}

interface PokemonTCGCard {
  id: string
  name: string
  supertype: string
  subtypes: string[]
  level?: string
  hp?: string
  types?: string[]
  evolvesFrom?: string
  evolvesTo?: string[]
  rules?: string[]
  images: {
    small: string
    large: string
  }
  tcgplayer: {
    url: string
    updatedAt: string
    prices: {
      normal?: TCGPlayerPrice
      holofoil?: TCGPlayerPrice
      reverseHolofoil?: TCGPlayerPrice
      firstEditionHolofoil?: TCGPlayerPrice
      firstEditionNormal?: TCGPlayerPrice
    }
  }
  set: {
    id: string
    name: string
    series: string
    printedTotal: number
    total: number
    legalities: {
      unlimited?: string
      standard?: string
      expanded?: string
    }
    releaseDate: string
    updatedAt: string
  }
  number: string
  artist: string
  rarity: string
  flavorText?: string
  nationalPokedexNumbers?: number[]
  legalities: {
    unlimited?: string
    standard?: string
    expanded?: string
  }
  cardmarket?: {
    url: string
    prices: {
      averageSellPrice: number
      avg1: number
      avg7: number
      avg30: number
      trendPrice: number
    }
  }
}

export interface CardData {
  id: string
  name: string
  image: string
  rarity: string
  set: string
  setId: string
  number: string
  prices: {
    market: number
    low: number
    mid: number
    high: number
  }
  tcgplayer?: {
    prices?: {
      normal?: {
        market: number
        low: number
        mid: number
        high: number
      }
      holofoil?: {
        market: number
        low: number
        mid: number
        high: number
      }
      reverseHolofoil?: {
        market: number
        low: number
        mid: number
        high: number
      }
    }
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
}

// Configuration
const API_KEY = process.env.POKEMON_TCG_API_KEY

if (!API_KEY) {
  console.warn("Pokemon TCG API key is not set")
}

interface SearchOptions {
  set?: string
  region?: string
  number?: string
  forceSet?: boolean
}

// Configuration des séries dans l'ordre chronologique inverse
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

type Series = typeof SERIES_ORDER[number]



// Service
export class PokemonTCGService {
  private static headers = {
    "X-Api-Key": API_KEY || "",
    "Content-Type": "application/json",
  }

  private static getBestPrice(prices: PokemonTCGCard["tcgplayer"]["prices"]): TCGPlayerPrice {
    // On priorise les prix dans cet ordre
    const priceTypes = ["normal", "holofoil", "reverseHolofoil", "firstEditionHolofoil", "firstEditionNormal"] as const
    
    for (const type of priceTypes) {
      if (prices[type]) {
        return prices[type]!
      }
    }

    // Prix par défaut si aucun n'est trouvé
    return {
      low: 0,
      mid: 0,
      high: 0,
      market: 0,
      directLow: 0
    }
  }

  private static compareCardNumbers(a: string, b: string): number {
    // Fonction pour extraire le numéro et le suffixe d'une carte
    const parseCardNumber = (num: string) => {
      const match = num.match(/^(\d+)([a-zA-Z]*)/);
      if (!match) return { number: 0, suffix: '' };
      return {
        number: parseInt(match[1], 10),
        suffix: match[2].toLowerCase()
      };
    };

    const numA = parseCardNumber(a);
    const numB = parseCardNumber(b);

    // D'abord comparer les numéros
    if (numA.number !== numB.number) {
      return numA.number - numB.number;
    }
    
    // Si les numéros sont égaux, comparer les suffixes
    return numA.suffix.localeCompare(numB.suffix);
  }

  static async getSets(): Promise<SetInfo[]> {
    try {
      console.log("🔄 Chargement des sets...")
      const response = await fetch('/api/pokemon/sets')

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Erreur API:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const { data } = await response.json() as PokemonTCGResponse<SetInfo[]>
      console.log(`✅ ${data.length} sets chargés`)
      
      // Tri des sets par série et date de sortie
      const sortedData = data.sort((a, b) => {
        const seriesAIndex = SERIES_ORDER.indexOf(a.series as Series)
        const seriesBIndex = SERIES_ORDER.indexOf(b.series as Series)
        
        // Si une des séries n'est pas dans l'ordre défini, la mettre à la fin
        if (seriesAIndex === -1) return 1
        if (seriesBIndex === -1) return -1
        
        if (seriesAIndex !== seriesBIndex) {
          return seriesAIndex - seriesBIndex
        }
        
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      })

      console.log("📦 Sets triés par série:", 
        Object.groupBy(sortedData, set => set.series)
      )

      return sortedData
    } catch (error) {
      console.error("❌ Erreur lors du chargement des sets:", error)
      throw new Error(
        error instanceof Error 
          ? `Erreur lors du chargement des sets: ${error.message}`
          : "Erreur inconnue lors du chargement des sets"
      )
    }
  }

  static async searchCards(query: string, options: SearchOptions = {}): Promise<CardData[]> {
    try {
      const searchQueries: string[] = []
      let allCards: PokemonTCGCard[] = []
      let page = 1
      let hasMorePages = true

      // Gestion de la recherche par numéro de set (ex: sv8 025)
      const setNumberMatch = query.match(/^(\w+)\s*(\d+)$/)
      if (setNumberMatch) {
        const [, setPrefix, cardNumber] = setNumberMatch
        searchQueries.push(`set.id:${setPrefix.toLowerCase()}*`)
        searchQueries.push(`number:${cardNumber.padStart(3, "0")}`)
      } else if (query) {
        searchQueries.push(`name:"*${encodeURIComponent(query.trim().toLowerCase())}*"`)
      }
      
      // Ajout des filtres optionnels
      if (options.set) {
        searchQueries.push(`set.id:${options.set}`)
      }

      // Si forceSet est true et qu'un set est spécifié, on ne met pas de filtre de nom
      if (!options.forceSet && searchQueries.length === 0) {
        throw new Error("Veuillez spécifier au moins un critère de recherche")
      }

      // Gestion spécifique des régions
      if (options.region) {
        if (options.region === "jp") {
          searchQueries.push('(set.printedTotal:>0 language:Japanese)')
        } else if (options.region === "en") {
          searchQueries.push('(set.printedTotal:>0 language:English)')
        }
      }

      if (options.number) {
        searchQueries.push(`number:${options.number}`)
      }

      // Boucle pour récupérer toutes les pages
      while (hasMorePages) {
        const searchParams = new URLSearchParams()
        searchParams.append("q", searchQueries.join(" "))
        searchParams.append("orderBy", "number")
        searchParams.append("page", page.toString())
        searchParams.append("pageSize", "250")
        searchParams.append("select", "id,name,images,rarity,set,number,tcgplayer,cardmarket")

        console.log(`Récupération de la page ${page}...`)
        const response = await fetch(`/api/pokemon/cards?${searchParams.toString()}`)

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const { data, totalCount } = await response.json() as PokemonTCGResponse<PokemonTCGCard[]>
        allCards = [...allCards, ...data]
        
        // Vérifier s'il y a d'autres pages
        hasMorePages = allCards.length < totalCount
        page++

        // Limite de sécurité pour éviter les boucles infinies
        if (page > 10) break
      }

      // Tri final des cartes par numéro
      allCards.sort((a, b) => this.compareCardNumbers(a.number, b.number))
      
      return allCards.map((card) => {
        const prices = card.tcgplayer?.prices ? this.getBestPrice(card.tcgplayer.prices) : null
        return {
          id: card.id,
          name: card.name,
          image: card.images.large,
          rarity: card.rarity,
          set: card.set.name,
          setId: card.set.id,
          number: card.number,
          prices: {
            market: prices?.market || 0,
            low: prices?.low || 0,
            mid: prices?.mid || 0,
            high: prices?.high || 0
          },
          marketPrices: card.cardmarket ? {
            avg1: card.cardmarket.prices.avg1,
            avg7: card.cardmarket.prices.avg7,
            avg30: card.cardmarket.prices.avg30,
            trendPrice: card.cardmarket.prices.trendPrice
          } : undefined,
          links: {
            tcgplayer: card.tcgplayer?.url,
            cardmarket: card.cardmarket?.url
          }
        }
      })
    } catch (error) {
      console.error("Error searching cards:", error)
      throw error
    }
  }

  static async getCardById(id: string): Promise<CardData | null> {
    try {
      const response = await fetch(
        `/api/pokemon/cards/${id}?select=id,name,images,rarity,set,number,tcgplayer,cardmarket`
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const { data: card } = await response.json() as PokemonTCGSingleResponse<PokemonTCGCard>
      const prices = card.tcgplayer?.prices ? this.getBestPrice(card.tcgplayer.prices) : null

      return {
        id: card.id,
        name: card.name,
        image: card.images.large,
        rarity: card.rarity,
        set: card.set.name,
        setId: card.set.id,
        number: card.number,
        prices: {
          market: prices?.market || 0,
          low: prices?.low || 0,
          mid: prices?.mid || 0,
          high: prices?.high || 0
        },
        marketPrices: card.cardmarket ? {
          avg1: card.cardmarket.prices.avg1,
          avg7: card.cardmarket.prices.avg7,
          avg30: card.cardmarket.prices.avg30,
          trendPrice: card.cardmarket.prices.trendPrice
        } : undefined,
        links: {
          tcgplayer: card.tcgplayer?.url,
          cardmarket: card.cardmarket?.url
        }
      }
    } catch (error) {
      console.error("Error getting card:", error)
      throw error
    }
  }

  static async getPokeDataSales(setName: string, cardNumber: string) {
    try {
      const response = await fetch(
        `/api/pokemon/pokedata/sales?setName=${encodeURIComponent(setName)}&cardNumber=${encodeURIComponent(cardNumber)}`
      )

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('Erreur lors de la récupération des données PokeData:', error)
      throw error
    }
  }
} 