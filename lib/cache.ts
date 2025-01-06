type CacheEntry = {
  data: string
  timestamp: number
}

type CacheStats = {
  hits: number
  misses: number
  totalRequests: number
  lastReset: number
}

type RateLimitEntry = {
  count: number
  timestamp: number
}

class CardmarketCache {
  private static cache: Map<string, CacheEntry> = new Map()
  private static rateLimits: Map<string, RateLimitEntry> = new Map()
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    lastReset: Date.now()
  }

  private static CACHE_DURATION = 1000 * 60 * 30 // 30 minutes
  private static RATE_LIMIT_WINDOW = 1000 * 60 // 1 minute
  private static RATE_LIMIT_MAX = 10 // 10 requêtes par minute

  static set(key: string, data: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  static get(key: string): string | null {
    this.stats.totalRequests++
    
    const entry = this.cache.get(key)
    if (!entry) {
      this.stats.misses++
      return null
    }

    // Vérifier si l'entrée est expirée
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.data
  }

  static checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const entry = this.rateLimits.get(ip)

    if (!entry) {
      this.rateLimits.set(ip, { count: 1, timestamp: now })
      return true
    }

    // Réinitialiser si la fenêtre est dépassée
    if (now - entry.timestamp > this.RATE_LIMIT_WINDOW) {
      this.rateLimits.set(ip, { count: 1, timestamp: now })
      return true
    }

    // Vérifier la limite
    if (entry.count >= this.RATE_LIMIT_MAX) {
      return false
    }

    // Incrémenter le compteur
    entry.count++
    return true
  }

  static getStats(): CacheStats {
    return { ...this.stats }
  }

  static clear(): void {
    this.cache.clear()
    this.rateLimits.clear()
    this.resetStats()
  }

  static resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      lastReset: Date.now()
    }
  }

  // Nettoyer les entrées expirées
  static cleanup(): void {
    const now = Date.now()
    
    // Nettoyer le cache
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key)
      }
    }

    // Nettoyer les rate limits
    for (const [ip, entry] of this.rateLimits.entries()) {
      if (now - entry.timestamp > this.RATE_LIMIT_WINDOW) {
        this.rateLimits.delete(ip)
      }
    }
  }
}

export default CardmarketCache 