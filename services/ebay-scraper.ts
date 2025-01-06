import { EbaySale, PriceAnalysis, TimeFrameAnalysis, EbayPriceAnalysis } from '../types/ebay'

interface PokeDataSale {
  price: number
  grade: string
  date: string
  title: string
  condition: string
  is_auction: boolean
  listing_id: string
  bids: number
}

// Mapping statique complet des sets entre pokemontcg.io et pokedata.io
const SET_MAPPING: Record<string, { name: string; id: string }> = {
  // Sets récents
  'sv8': { name: 'Surging Sparks', id: '555' },
  'Surging Sparks': { name: 'Surging Sparks', id: '555' },
  'sv7': { name: 'Stellar Crown', id: '549' },
  'Stellar Crown': { name: 'Stellar Crown', id: '549' },
  'sv6pt5': { name: 'Shrouded Fable', id: '548' },
  'Shrouded Fable': { name: 'Shrouded Fable', id: '548' },
  'sv6': { name: 'Twilight Masquerade', id: '545' },
  'Twilight Masquerade': { name: 'Twilight Masquerade', id: '545' },
  'sv5': { name: 'Temporal Forces', id: '542' },
  'Temporal Forces': { name: 'Temporal Forces', id: '542' },
  'sv4pt5': { name: 'Paldean Fates', id: '539' },
  'Paldean Fates': { name: 'Paldean Fates', id: '539' },
  'sv4': { name: 'Paradox Rift', id: '536' },
  'Paradox Rift': { name: 'Paradox Rift', id: '536' },
  'sv3pt5': { name: 'Pokemon Card 151', id: '532' },
  '151': { name: 'Pokemon Card 151', id: '532' },
  'sv3': { name: 'Obsidian Flames', id: '517' },
  'Obsidian Flames': { name: 'Obsidian Flames', id: '517' },
  'sv2': { name: 'Paldea Evolved', id: '513' },
  'Paldea Evolved': { name: 'Paldea Evolved', id: '513' },
  'sv1': { name: 'Scarlet & Violet Base', id: '510' },
  'Scarlet & Violet': { name: 'Scarlet & Violet Base', id: '510' },

  // Crown Zenith et ses variantes
  'swsh12pt5': { name: 'Crown Zenith', id: '506' },
  'Crown Zenith': { name: 'Crown Zenith', id: '506' },
  'swsh12pt5gg': { name: 'Crown Zenith', id: '506' },
  'Crown Zenith Galarian Gallery': { name: 'Crown Zenith', id: '506' },

  // Silver Tempest et ses variantes
  'swsh12': { name: 'Silver Tempest', id: '503' },
  'Silver Tempest': { name: 'Silver Tempest', id: '503' },
  'swsh12tg': { name: 'Silver Tempest', id: '503' },
  'Silver Tempest Trainer Gallery': { name: 'Silver Tempest', id: '503' },

  // Lost Origin et ses variantes
  'swsh11': { name: 'Lost Origin', id: '400' },
  'Lost Origin': { name: 'Lost Origin', id: '400' },
  'swsh11tg': { name: 'Lost Origin', id: '400' },
  'Lost Origin Trainer Gallery': { name: 'Lost Origin', id: '400' },

  // Astral Radiance et ses variantes
  'swsh10': { name: 'Astral Radiance', id: '182' },
  'Astral Radiance': { name: 'Astral Radiance', id: '182' },
  'swsh10tg': { name: 'Astral Radiance', id: '182' },
  'Astral Radiance Trainer Gallery': { name: 'Astral Radiance', id: '182' },

  // Brilliant Stars et ses variantes
  'swsh9': { name: 'Brilliant Stars', id: '178' },
  'Brilliant Stars': { name: 'Brilliant Stars', id: '178' },
  'swsh9tg': { name: 'Brilliant Stars', id: '178' },
  'Brilliant Stars Trainer Gallery': { name: 'Brilliant Stars', id: '178' },

  // Fusion Strike
  'swsh8': { name: 'Fusion Strike', id: '172' },
  'Fusion Strike': { name: 'Fusion Strike', id: '172' },

  // Evolving Skies
  'swsh7': { name: 'Evolving Skies', id: '108' },
  'Evolving Skies': { name: 'Evolving Skies', id: '108' },

  // Chilling Reign
  'swsh6': { name: 'Chilling Reign', id: '26' },
  'Chilling Reign': { name: 'Chilling Reign', id: '26' },

  // Battle Styles
  'swsh5': { name: 'Battle Styles', id: '20' },
  'Battle Styles': { name: 'Battle Styles', id: '20' },

  // Shining Fates et ses variantes
  'swsh45': { name: 'Shining Fates', id: '21' },
  'Shining Fates': { name: 'Shining Fates', id: '21' },
  'swsh45sv': { name: 'Shining Fates', id: '21' },
  'Shining Fates Shiny Vault': { name: 'Shining Fates', id: '21' },

  // Champion's Path
  'swsh35': { name: "Champion's Path", id: '2' },
  "Champion's Path": { name: "Champion's Path", id: '2' },

  // Darkness Ablaze
  'swsh3': { name: 'Darkness Ablaze', id: '4' },
  'Darkness Ablaze': { name: 'Darkness Ablaze', id: '4' },

  // Rebel Clash
  'swsh2': { name: 'Rebel Clash', id: '5' },
  'Rebel Clash': { name: 'Rebel Clash', id: '5' },

  // Sword & Shield Base
  'swsh1': { name: 'Sword & Shield', id: '6' },
  'Sword & Shield': { name: 'Sword & Shield', id: '6' },

  // Hidden Fates et ses variantes
  'sm115': { name: 'Hidden Fates', id: '1' },
  'Hidden Fates': { name: 'Hidden Fates', id: '1' },
  'sma': { name: 'Hidden Fates', id: '1' },
  'Hidden Fates Shiny Vault': { name: 'Hidden Fates', id: '1' },

  // Autres sets modernes
  'sm12': { name: 'Cosmic Eclipse', id: '7' },
  'Cosmic Eclipse': { name: 'Cosmic Eclipse', id: '7' },
  'sm11': { name: 'Unified Minds', id: '8' },
  'Unified Minds': { name: 'Unified Minds', id: '8' },
  'sm10': { name: 'Unbroken Bonds', id: '24' },
  'Unbroken Bonds': { name: 'Unbroken Bonds', id: '24' },
  'sm9': { name: 'Team Up', id: '9' },
  'Team Up': { name: 'Team Up', id: '9' },
  'sm8': { name: 'Lost Thunder', id: '10' },
  'Lost Thunder': { name: 'Lost Thunder', id: '10' },
  'sm75': { name: 'Dragon Majesty', id: '11' },
  'Dragon Majesty': { name: 'Dragon Majesty', id: '11' },
  'sm7': { name: 'Celestial Storm', id: '12' },
  'Celestial Storm': { name: 'Celestial Storm', id: '12' },
  'sm6': { name: 'Forbidden Light', id: '13' },
  'Forbidden Light': { name: 'Forbidden Light', id: '13' },
  'sm5': { name: 'Ultra Prism', id: '14' },
  'Ultra Prism': { name: 'Ultra Prism', id: '14' },
  'sm4': { name: 'Crimson Invasion', id: '15' },
  'Crimson Invasion': { name: 'Crimson Invasion', id: '15' },
  'sm35': { name: 'Shining Legends', id: '16' },
  'Shining Legends': { name: 'Shining Legends', id: '16' },
  'sm3': { name: 'Burning Shadows', id: '17' },
  'Burning Shadows': { name: 'Burning Shadows', id: '17' },
  'sm2': { name: 'Guardians Rising', id: '18' },
  'Guardians Rising': { name: 'Guardians Rising', id: '18' },
  'sm1': { name: 'Sun & Moon', id: '19' },
  'Sun & Moon': { name: 'Sun & Moon', id: '19' },

  // XY Series
  'xy12': { name: 'Evolutions', id: '22' },
  'Evolutions': { name: 'Evolutions', id: '22' },
  'xy11': { name: 'Steam Siege', id: '31' },
  'Steam Siege': { name: 'Steam Siege', id: '31' },
  'xy10': { name: 'Fates Collide', id: '32' },
  'Fates Collide': { name: 'Fates Collide', id: '32' },
  'xy9': { name: 'BREAKpoint', id: '34' },
  'BREAKpoint': { name: 'BREAKpoint', id: '34' },
  'xy8': { name: 'BREAKthrough', id: '35' },
  'BREAKthrough': { name: 'BREAKthrough', id: '35' },
  'xy7': { name: 'Ancient Origins', id: '36' },
  'Ancient Origins': { name: 'Ancient Origins', id: '36' },
  'xy6': { name: 'Roaring Skies', id: '37' },
  'Roaring Skies': { name: 'Roaring Skies', id: '37' },
  'xy5': { name: 'Primal Clash', id: '38' },
  'Primal Clash': { name: 'Primal Clash', id: '38' },
  'xy4': { name: 'Phantom Forces', id: '39' },
  'Phantom Forces': { name: 'Phantom Forces', id: '39' },
  'xy3': { name: 'Furious Fists', id: '40' },
  'Furious Fists': { name: 'Furious Fists', id: '40' },
  'xy2': { name: 'Flashfire', id: '41' },
  'Flashfire': { name: 'Flashfire', id: '41' },
  'xy1': { name: 'XY Base', id: '42' },
  'XY': { name: 'XY Base', id: '42' },

  // Black & White Series
  'bw11': { name: 'Legendary Treasures', id: '43' },
  'Legendary Treasures': { name: 'Legendary Treasures', id: '43' },
  'bw10': { name: 'Plasma Blast', id: '44' },
  'Plasma Blast': { name: 'Plasma Blast', id: '44' },
  'bw9': { name: 'Plasma Freeze', id: '45' },
  'Plasma Freeze': { name: 'Plasma Freeze', id: '45' },
  'bw8': { name: 'Plasma Storm', id: '46' },
  'Plasma Storm': { name: 'Plasma Storm', id: '46' },
  'bw7': { name: 'Boundaries Crossed', id: '47' },
  'Boundaries Crossed': { name: 'Boundaries Crossed', id: '47' },
  'bw6': { name: 'Dragons Exalted', id: '48' },
  'Dragons Exalted': { name: 'Dragons Exalted', id: '48' },
  'bw5': { name: 'Dark Explorers', id: '49' },
  'Dark Explorers': { name: 'Dark Explorers', id: '49' },
  'bw4': { name: 'Next Destinies', id: '97' },
  'Next Destinies': { name: 'Next Destinies', id: '97' },
  'bw3': { name: 'Noble Victories', id: '50' },
  'Noble Victories': { name: 'Noble Victories', id: '50' },
  'bw2': { name: 'Emerging Powers', id: '51' },
  'Emerging Powers': { name: 'Emerging Powers', id: '51' },

  // HeartGold SoulSilver Series
  'hgss4': { name: 'Triumphant', id: '53' },
  'HS—Triumphant': { name: 'Triumphant', id: '53' },
  'hgss3': { name: 'Undaunted', id: '54' },
  'HS—Undaunted': { name: 'Undaunted', id: '54' },
  'hgss2': { name: 'Unleashed', id: '55' },
  'HS—Unleashed': { name: 'Unleashed', id: '55' },

  // Platinum Series
  'pl4': { name: 'Arceus', id: '56' },
  'Arceus': { name: 'Arceus', id: '56' },
  'pl3': { name: 'Supreme Victors', id: '57' },
  'Supreme Victors': { name: 'Supreme Victors', id: '57' },
  'pl2': { name: 'Rising Rivals', id: '100' },
  'Rising Rivals': { name: 'Rising Rivals', id: '100' },
  'pl1': { name: 'Platinum', id: '98' },
  'Platinum': { name: 'Platinum', id: '98' },

  // Diamond & Pearl Series
  'dp7': { name: 'Stormfront', id: '105' },
  'Stormfront': { name: 'Stormfront', id: '105' },
  'dp6': { name: 'Legends Awakened', id: '58' },
  'Legends Awakened': { name: 'Legends Awakened', id: '58' },
  'dp5': { name: 'Majestic Dawn', id: '87' },
  'Majestic Dawn': { name: 'Majestic Dawn', id: '87' },
  'dp4': { name: 'Great Encounters', id: '59' },
  'Great Encounters': { name: 'Great Encounters', id: '59' },
  'dp3': { name: 'Secret Wonders', id: '103' },
  'Secret Wonders': { name: 'Secret Wonders', id: '103' },
  'dp2': { name: 'Mysterious Treasures', id: '88' },
  'Mysterious Treasures': { name: 'Mysterious Treasures', id: '88' },
  'dp1': { name: 'Diamond & Pearl', id: '60' },
  'Diamond & Pearl': { name: 'Diamond & Pearl', id: '60' },

  // EX Series
  'ex16': { name: 'Power Keepers', id: '99' },
  'Power Keepers': { name: 'Power Keepers', id: '99' },
  'ex15': { name: 'Dragon Frontiers', id: '61' },
  'Dragon Frontiers': { name: 'Dragon Frontiers', id: '61' },
  'ex14': { name: 'Crystal Guardians', id: '62' },
  'Crystal Guardians': { name: 'Crystal Guardians', id: '62' },
  'ex13': { name: 'Holon Phantoms', id: '82' },
  'Holon Phantoms': { name: 'Holon Phantoms', id: '82' },
  'ex12': { name: 'Legend Maker', id: '85' },
  'Legend Maker': { name: 'Legend Maker', id: '85' },
  'ex11': { name: 'Delta Species', id: '63' },
  'Delta Species': { name: 'Delta Species', id: '63' },
  'ex10': { name: 'Unseen Forces', id: '64' },
  'Unseen Forces': { name: 'Unseen Forces', id: '64' },
  'ex9': { name: 'Emerald', id: '65' },
  'Emerald': { name: 'Emerald', id: '65' },
  'ex8': { name: 'Deoxys', id: '66' },
  'Deoxys': { name: 'Deoxys', id: '66' },
  'ex5': { name: 'Hidden Legends', id: '81' },
  'Hidden Legends': { name: 'Hidden Legends', id: '81' },
  'ex4': { name: 'Team Magma vs Team Aqua', id: '106' },
  'Team Magma vs Team Aqua': { name: 'Team Magma vs Team Aqua', id: '106' },
  'ex3': { name: 'Dragon Majesty', id: '11' },
  'Dragon': { name: 'Dragon Majesty', id: '11' },
  'ex2': { name: 'Sandstorm', id: '102' },
  'Sandstorm': { name: 'Sandstorm', id: '102' },

  // E-Card Series
  'ecard3': { name: 'Skyridge', id: '104' },
  'Skyridge': { name: 'Skyridge', id: '104' },
  'ecard2': { name: 'Aquapolis', id: '68' },
  'Aquapolis': { name: 'Aquapolis', id: '68' },
  'ecard1': { name: 'Expedition', id: '74' },
  'Expedition Base Set': { name: 'Expedition', id: '74' },

  // Neo Series
  'neo4': { name: 'Neo Destiny', id: '89' },
  'Neo Destiny': { name: 'Neo Destiny', id: '89' },
  'neo3': { name: 'Neo Revelation', id: '95' },
  'Neo Revelation': { name: 'Neo Revelation', id: '95' },
  'neo2': { name: 'Neo Discovery', id: '91' },
  'Neo Discovery': { name: 'Neo Discovery', id: '91' },
  'neo1': { name: 'Neo Genesis', id: '93' },
  'Neo Genesis': { name: 'Neo Genesis', id: '93' },

  // Base Set Series
  'base6': { name: 'Legendary Collection', id: '86' },
  'Legendary Collection': { name: 'Legendary Collection', id: '86' },
  'base5': { name: 'Team Rocket Returns', id: '107' },
  'Team Rocket': { name: 'Team Rocket Returns', id: '107' },
  'base4': { name: 'Base Set 2', id: '73' },
  'Base Set 2': { name: 'Base Set 2', id: '73' },
  'base3': { name: 'Fossil', id: '71' },
  'Fossil': { name: 'Fossil', id: '71' },
  'base2': { name: 'Jungle', id: '83' },
  'Jungle': { name: 'Jungle', id: '83' },
  'base1': { name: 'Scarlet & Violet Base', id: '510' },
  'Base': { name: 'Scarlet & Violet Base', id: '510' },

  // Promos
  'xyp': { name: 'XY Black Star Promos', id: '175' },
  'XY Black Star Promos': { name: 'XY Black Star Promos', id: '175' },
  'hsp': { name: 'HGSS Black Star Promo', id: '518' },
  'HGSS Black Star Promos': { name: 'HGSS Black Star Promo', id: '518' },
  'np': { name: 'Nintendo Black Star Promo', id: '519' },
  'Nintendo Black Star Promos': { name: 'Nintendo Black Star Promo', id: '519' },

  // POP Series
  'pop9': { name: 'Pop Series 9', id: '398' },
  'POP Series 9': { name: 'Pop Series 9', id: '398' },
  'pop8': { name: 'Pop Series 8', id: '397' },
  'POP Series 8': { name: 'Pop Series 8', id: '397' },
  'pop7': { name: 'Pop Series 7', id: '396' },
  'POP Series 7': { name: 'Pop Series 7', id: '396' },
  'pop6': { name: 'Pop Series 6', id: '395' },
  'POP Series 6': { name: 'Pop Series 6', id: '395' },
  'pop5': { name: 'Pop Series 5', id: '394' },
  'POP Series 5': { name: 'Pop Series 5', id: '394' },
  'pop4': { name: 'Pop Series 4', id: '393' },
  'POP Series 4': { name: 'Pop Series 4', id: '393' },
  'pop3': { name: 'Pop Series 3', id: '392' },
  'POP Series 3': { name: 'Pop Series 3', id: '392' },
  'pop2': { name: 'Pop Series 2', id: '391' },
  'POP Series 2': { name: 'Pop Series 2', id: '391' },
  'pop1': { name: 'Pop Series 1', id: '390' },
  'POP Series 1': { name: 'Pop Series 1', id: '390' },

  // Autres sets spéciaux
  'det1': { name: 'Detective Pikachu', id: '23' },
  'Detective Pikachu': { name: 'Detective Pikachu', id: '23' },
  'dc1': { name: 'Double Crisis', id: '291' },
  'Double Crisis': { name: 'Double Crisis', id: '291' },
  'dv1': { name: 'Dragon Vault', id: '389' },
  'Dragon Vault': { name: 'Dragon Vault', id: '389' },
  'si1': { name: 'Southern Islands', id: '290' },
  'Southern Islands': { name: 'Southern Islands', id: '290' },
  'cel25': { name: 'Celebrations', id: '112' },
  'Celebrations': { name: 'Celebrations', id: '112' },
  'cel25c': { name: 'Celebrations', id: '112' },
  'Celebrations: Classic Collection': { name: 'Celebrations', id: '112' },
  'g1': { name: 'Generations Radiant Collection', id: '169' },
  'Generations': { name: 'Generations Radiant Collection', id: '169' }
}

export class EbayScraperService {
  private static API_BASE_URL = 'https://www.pokedata.io/api/v1'

  static async getSales(setName: string, cardNumber: string): Promise<EbaySale[]> {
    try {
      const mappedSet = SET_MAPPING[setName]
      if (!mappedSet) {
        throw new Error(`Set non trouvé: ${setName}`)
      }

      const response = await fetch(
        `${this.API_BASE_URL}/card/${mappedSet.id}/${cardNumber}/sales`,
        {
          headers: {
            'X-Api-Key': process.env.POKEDATA_API_KEY || ''
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      return data.sales.map((sale: PokeDataSale) => ({
        price: sale.price,
        condition: sale.condition,
        dateSold: sale.date,
        title: sale.title,
        isAuction: sale.is_auction,
        listingId: sale.listing_id,
        bids: sale.bids,
        grade: sale.grade.toLowerCase()
      }))
    } catch (error) {
      console.error('Erreur lors de la récupération des ventes:', error)
      throw error
    }
  }

  static async analyzePrices(sales: EbaySale[]): Promise<EbayPriceAnalysis> {
    const now = new Date()
    const timeFrames = ['24h', '7d', '30d', '90d', '1y', 'all'] as const

    // Fonction pour calculer les statistiques d'une période
    const calculateTimeFrameStats = (sales: EbaySale[]): TimeFrameAnalysis => {
      if (sales.length === 0) {
        return {
          averagePrice: 0,
          minPrice: 0,
          maxPrice: 0,
          salesCount: 0,
          trend: 0,
          priceHistory: []
        }
      }

      const prices = sales.map(s => s.price)
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)

      // Calcul de la tendance
      const sortedSales = [...sales].sort((a, b) => 
        new Date(a.dateSold).getTime() - new Date(b.dateSold).getTime()
      )
      const oldestPrice = sortedSales[0].price
      const newestPrice = sortedSales[sortedSales.length - 1].price
      const trend = ((newestPrice - oldestPrice) / oldestPrice) * 100

      // Historique des prix
      const priceHistory = sortedSales.map(sale => ({
        date: sale.dateSold,
        price: sale.price
      }))

      return {
        averagePrice,
        minPrice,
        maxPrice,
        salesCount: sales.length,
        trend,
        priceHistory
      }
    }

    // Grouper les ventes par grade
    const salesByGrade = {
      raw: sales.filter(s => !s.grade || s.grade === 'raw'),
      psa8: sales.filter(s => s.grade === 'psa 8'),
      psa9: sales.filter(s => s.grade === 'psa 9'),
      psa10: sales.filter(s => s.grade === 'psa 10')
    }

    // Créer l'analyse pour chaque grade
    const result: EbayPriceAnalysis = {
      raw: this.createGradeAnalysis(salesByGrade.raw, now, timeFrames, calculateTimeFrameStats),
      psa8: this.createGradeAnalysis(salesByGrade.psa8, now, timeFrames, calculateTimeFrameStats),
      psa9: this.createGradeAnalysis(salesByGrade.psa9, now, timeFrames, calculateTimeFrameStats),
      psa10: this.createGradeAnalysis(salesByGrade.psa10, now, timeFrames, calculateTimeFrameStats)
    }

    return result
  }

  private static createGradeAnalysis(
    sales: EbaySale[],
    now: Date,
    timeFrames: readonly ['24h', '7d', '30d', '90d', '1y', 'all'],
    calculateTimeFrameStats: (sales: EbaySale[]) => TimeFrameAnalysis
  ): PriceAnalysis {
    if (sales.length === 0) {
      return {
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        trend: 0,
        recentSales: [],
        timeFrames: {
          '24h': calculateTimeFrameStats([]),
          '7d': calculateTimeFrameStats([]),
          '30d': calculateTimeFrameStats([]),
          '90d': calculateTimeFrameStats([]),
          '1y': calculateTimeFrameStats([]),
          'all': calculateTimeFrameStats([])
        },
        priceDistribution: {
          standardDeviation: 0,
          median: 0,
          mode: 0,
          quartiles: { q1: 0, q2: 0, q3: 0 }
        },
        auctionAnalysis: {
          auctionPercentage: 0,
          averageBids: 0,
          auctionPriceDifference: 0,
          bidDistribution: { min: 0, max: 0, average: 0 }
        }
      }
    }

    const prices = sales.map(s => s.price)
    const timeFrameAnalyses: Record<string, TimeFrameAnalysis> = {}

    // Calculer les analyses pour chaque période
    timeFrames.forEach(timeFrame => {
      let cutoffDate = new Date(now)
      switch (timeFrame) {
        case '24h':
          cutoffDate.setHours(cutoffDate.getHours() - 24)
          break
        case '7d':
          cutoffDate.setDate(cutoffDate.getDate() - 7)
          break
        case '30d':
          cutoffDate.setDate(cutoffDate.getDate() - 30)
          break
        case '90d':
          cutoffDate.setDate(cutoffDate.getDate() - 90)
          break
        case '1y':
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 1)
          break
        case 'all':
          cutoffDate = new Date(0)
          break
      }

      const periodSales = sales.filter(sale => 
        new Date(sale.dateSold) >= cutoffDate
      )

      timeFrameAnalyses[timeFrame] = calculateTimeFrameStats(periodSales)
    })

    // Calculer les statistiques de distribution
    const sortedPrices = [...prices].sort((a, b) => a - b)
    const n = sortedPrices.length
    const mean = prices.reduce((a, b) => a + b, 0) / n
    const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n
    const standardDeviation = Math.sqrt(variance)
    const median = sortedPrices[Math.floor(n / 2)]
    const q1 = sortedPrices[Math.floor(n * 0.25)]
    const q2 = median
    const q3 = sortedPrices[Math.floor(n * 0.75)]

    // Calculer le mode
    const priceFrequency: Record<number, number> = {}
    let maxFreq = 0
    let mode = sortedPrices[0]
    sortedPrices.forEach(price => {
      priceFrequency[price] = (priceFrequency[price] || 0) + 1
      if (priceFrequency[price] > maxFreq) {
        maxFreq = priceFrequency[price]
        mode = price
      }
    })

    // Analyse des enchères
    const auctionSales = sales.filter(s => s.isAuction)
    const buyItNowSales = sales.filter(s => !s.isAuction)
    const bids = auctionSales.map(s => s.bids || 0)

    const auctionPercentage = (auctionSales.length / sales.length) * 100
    const averageBids = auctionSales.length > 0
      ? bids.reduce((a, b) => a + b, 0) / auctionSales.length
      : 0

    const avgAuctionPrice = auctionSales.length > 0
      ? auctionSales.reduce((a, s) => a + s.price, 0) / auctionSales.length
      : 0
    const avgBuyItNowPrice = buyItNowSales.length > 0
      ? buyItNowSales.reduce((a, s) => a + s.price, 0) / buyItNowSales.length
      : 0
    const auctionPriceDifference = avgBuyItNowPrice > 0
      ? ((avgAuctionPrice - avgBuyItNowPrice) / avgBuyItNowPrice) * 100
      : 0

    return {
      averagePrice: mean,
      minPrice: sortedPrices[0],
      maxPrice: sortedPrices[n - 1],
      trend: timeFrameAnalyses['30d'].trend,
      recentSales: [...sales]
        .sort((a, b) => new Date(b.dateSold).getTime() - new Date(a.dateSold).getTime())
        .slice(0, 30),
      timeFrames: timeFrameAnalyses as PriceAnalysis['timeFrames'],
      priceDistribution: {
        standardDeviation,
        median,
        mode,
        quartiles: { q1, q2, q3 }
      },
      auctionAnalysis: {
        auctionPercentage,
        averageBids,
        auctionPriceDifference,
        bidDistribution: {
          min: bids.length > 0 ? Math.min(...bids) : 0,
          max: bids.length > 0 ? Math.max(...bids) : 0,
          average: averageBids
        }
      }
    }
  }
} 