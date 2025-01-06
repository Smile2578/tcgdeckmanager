import { EbayPriceAnalysis, EbaySale } from '../types/ebay'
import { EbayScraperService } from './ebay-scraper'

interface CardSale {
  date_sold: string
  sold_price: number
  type: string
  condition: string
  num_bids: number
  ebay_item_id: string
  title: string
  seller_name: string
}

interface GraphQLResponse {
  data?: {
    card?: {
      sales: CardSale[]
    }
  }
}

export class PokeDataScraperService {
  private static POKEDATA_BASE_URL = 'https://www.pokedata.io'
  private static API_KEY = process.env.POKEDATA_API_KEY || ''

  static async scrapeCard(setName: string, cardNumber: string): Promise<EbayPriceAnalysis> {
    try {
      // Formater le nom du set et le numéro de carte pour l'URL
      const formattedSetName = setName.replace(/\s+/g, '+')
      const formattedCardNumber = cardNumber.replace(/\s+/g, '+')
      const pageUrl = `${this.POKEDATA_BASE_URL}/card/${formattedSetName}/${formattedCardNumber}`
      
      // Construire l'URL de l'API GraphQL
      const apiUrl = `${this.POKEDATA_BASE_URL}/api/graphql`
      console.log(`🔍 Récupération des données depuis: ${pageUrl}`)

      // Requête GraphQL pour obtenir les ventes
      const graphqlQuery = {
        query: `
          query GetCardSales($setName: String!, $cardNumber: String!) {
            card(setName: $setName, cardNumber: $cardNumber) {
              sales {
                date_sold
                sold_price
                type
                condition
                num_bids
                ebay_item_id
                title
                seller_name
              }
            }
          }
        `,
        variables: {
          setName: formattedSetName,
          cardNumber: formattedCardNumber
        }
      }

      // Faire la requête à l'API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Referer': pageUrl,
          'Origin': this.POKEDATA_BASE_URL,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Authorization': `Bearer ${this.API_KEY}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(graphqlQuery)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Réponse API:', errorText)
        throw new Error(`Erreur API: ${response.status}`)
      }

      const result = await response.json() as GraphQLResponse
      const sales = result.data?.card?.sales || []
      console.log(`✅ ${sales.length} ventes trouvées`)

      // Convertir les données au format EbaySale
      const ebaysSales: EbaySale[] = sales.map((sale: CardSale) => ({
        price: sale.sold_price,
        grade: sale.condition.toLowerCase(),
        bids: sale.num_bids,
        dateSold: sale.date_sold,
        listingId: sale.ebay_item_id,
        title: sale.title,
        condition: sale.condition.toLowerCase(),
        isAuction: sale.type.toLowerCase().includes('enchère')
      }))

      if (ebaysSales.length === 0) {
        throw new Error('Aucune donnée de vente trouvée')
      }

      // Analyser les données avec le service existant
      const analysis = await EbayScraperService.analyzePrices(ebaysSales)
      return analysis

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données:', error)
      throw error
    }
  }
} 