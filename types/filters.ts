export type CardLanguage = 'FR' | 'EN' | 'DE' | 'ES' | 'IT' | 'PT' | 'JP'

export type SellerType = 'private' | 'professional' | 'powerseller'

export type SellerReputation = 'bad' | 'average' | 'good' | 'outstanding'

export type CardCondition = 
  | 'MT' // Mint
  | 'NM' // Near Mint
  | 'EX' // Excellent
  | 'GD' // Good
  | 'LP' // Light Played
  | 'PL' // Played
  | 'PO' // Poor

export interface CardFilters {
  sellerLocation?: string
  sellerType?: SellerType[]
  minReputation?: SellerReputation
  maxShippingTime?: number
  languages?: CardLanguage[]
  minCondition?: CardCondition
  isSigned?: boolean
  isAltered?: boolean
  minQuantity?: number
}

export const CONDITIONS_ORDER: CardCondition[] = ['MT', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO']

export const LANGUAGES_MAP: Record<CardLanguage, string> = {
  'FR': 'Français',
  'EN': 'Anglais',
  'DE': 'Allemand',
  'ES': 'Espagnol',
  'IT': 'Italien',
  'PT': 'Portugais',
  'JP': 'Japonais'
}

export const SELLER_TYPES_MAP: Record<SellerType, string> = {
  'private': 'Particulier',
  'professional': 'Professionnel',
  'powerseller': 'Powerseller'
}

export const REPUTATION_MAP: Record<SellerReputation, string> = {
  'bad': 'Mauvais',
  'average': 'Moyen',
  'good': 'Bon',
  'outstanding': 'Excellent'
}

export const CONDITIONS_MAP: Record<CardCondition, string> = {
  'MT': 'Mint',
  'NM': 'Near Mint',
  'EX': 'Excellent',
  'GD': 'Good',
  'LP': 'Light Played',
  'PL': 'Played',
  'PO': 'Poor'
} 