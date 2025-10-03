import { supabase } from '@/integrations/supabase/client';

export interface SearchQuery {
  query: string;
  filters?: {
    category?: string;
    city?: string;
    priceRange?: { min: number; max: number };
    tags?: string[];
    availability?: 'available' | 'ready_today' | 'custom_order';
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popularity';
  };
  limit?: number;
  offset?: number;
  userId?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  seller: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
  };
  category: string;
  tags: string[];
  city: string;
  availability: string;
  relevanceScore: number;
  popularityScore: number;
  qualityScore: number;
  createdAt: string;
}

export interface SearchAnalytics {
  queryId: string;
  query: string;
  userId?: string;
  sessionId: string;
  resultsCount: number;
  clickedResults: string[];
  searchTime: number;
  filters: any;
  timestamp: Date;
}

export interface SearchSuggestion {
  text: string;
  type: 'query' | 'category' | 'tag' | 'seller';
  popularity: number;
  metadata?: any;
}

export class SemanticSearchEngine {
  private static instance: SemanticSearchEngine;
  private searchHistory: Map<string, SearchAnalytics[]> = new Map();
  private queryCache: Map<string, { results: SearchResult[]; timestamp: number }> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  static getInstance(): SemanticSearchEngine {
    if (!SemanticSearchEngine.instance) {
      SemanticSearchEngine.instance = new SemanticSearchEngine();
    }
    return SemanticSearchEngine.instance;
  }

  /**
   * Perform semantic search with natural language processing
   */
  async search(searchQuery: SearchQuery): Promise<{
    results: SearchResult[];
    totalCount: number;
    suggestions: SearchSuggestion[];
    analytics: SearchAnalytics;
  }> {
    const startTime = Date.now();
    const queryId = this.generateQueryId();
    const sessionId = this.getSessionId();

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(searchQuery);
      const cachedResult = this.queryCache.get(cacheKey);
      
      if (cachedResult && Date.now() - cachedResult.timestamp < this.cacheTimeout) {
        const analytics = this.createAnalytics(queryId, searchQuery, cachedResult.results.length, startTime, sessionId);
        await this.logSearchAnalytics(analytics);
        
        return {
          results: cachedResult.results,
          totalCount: cachedResult.results.length,
          suggestions: await this.generateSuggestions(searchQuery.query),
          analytics
        };
      }

      // Process and enhance the search query
      const processedQuery = await this.processNaturalLanguageQuery(searchQuery.query);
      
      // Build the search query with semantic understanding
      const searchResults = await this.executeSemanticSearch(searchQuery, processedQuery);
      
      // Apply AI-powered ranking and filtering
      const rankedResults = await this.applyIntelligentRanking(searchResults, searchQuery);
      
      // Generate search suggestions
      const suggestions = await this.generateSuggestions(searchQuery.query);
      
      // Cache results
      this.queryCache.set(cacheKey, {
        results: rankedResults,
        timestamp: Date.now()
      });

      // Create analytics
      const analytics = this.createAnalytics(queryId, searchQuery, rankedResults.length, startTime, sessionId);
      await this.logSearchAnalytics(analytics);

      return {
        results: rankedResults,
        totalCount: rankedResults.length,
        suggestions,
        analytics
      };
    } catch (error) {
      console.error('Search failed:', error);
      
      const analytics = this.createAnalytics(queryId, searchQuery, 0, startTime, sessionId);
      await this.logSearchAnalytics(analytics);
      
      throw error;
    }
  }

  /**
   * Process natural language query to extract intent and entities
   */
  private async processNaturalLanguageQuery(query: string): Promise<{
    originalQuery: string;
    processedQuery: string;
    entities: { type: string; value: string; confidence: number }[];
    intent: string;
    keywords: string[];
    synonyms: string[];
  }> {
    // Normalize the query
    const normalizedQuery = query.toLowerCase().trim();
    
    // Extract entities (simplified NLP - in production, use a proper NLP service)
    const entities = this.extractEntities(normalizedQuery);
    
    // Determine search intent
    const intent = this.determineSearchIntent(normalizedQuery);
    
    // Extract keywords
    const keywords = this.extractKeywords(normalizedQuery);
    
    // Generate synonyms and related terms
    const synonyms = await this.generateSynonyms(keywords);
    
    // Build processed query with expanded terms
    const processedQuery = this.buildProcessedQuery(normalizedQuery, keywords, synonyms);

    return {
      originalQuery: query,
      processedQuery,
      entities,
      intent,
      keywords,
      synonyms
    };
  }

  /**
   * Extract entities from natural language query
   */
  private extractEntities(query: string): { type: string; value: string; confidence: number }[] {
    const entities: { type: string; value: string; confidence: number }[] = [];
    
    // Price patterns
    const priceMatches = query.match(/\$?(\d+(?:\.\d{2})?)\s*(?:to|-)?\s*\$?(\d+(?:\.\d{2})?)?/g);
    if (priceMatches) {
      priceMatches.forEach(match => {
        entities.push({ type: 'price', value: match, confidence: 0.9 });
      });
    }

    // Color patterns
    const colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'pink', 'purple', 'orange'];
    colors.forEach(color => {
      if (query.includes(color)) {
        entities.push({ type: 'color', value: color, confidence: 0.8 });
      }
    });

    // Material patterns
    const materials = ['wood', 'metal', 'ceramic', 'glass', 'fabric', 'leather', 'plastic', 'stone'];
    materials.forEach(material => {
      if (query.includes(material)) {
        entities.push({ type: 'material', value: material, confidence: 0.8 });
      }
    });

    // Size patterns
    const sizes = ['small', 'medium', 'large', 'tiny', 'huge', 'mini', 'big'];
    sizes.forEach(size => {
      if (query.includes(size)) {
        entities.push({ type: 'size', value: size, confidence: 0.7 });
      }
    });

    return entities;
  }

  /**
   * Determine search intent from query
   */
  private determineSearchIntent(query: string): string {
    if (query.includes('buy') || query.includes('purchase') || query.includes('order')) {
      return 'purchase';
    }
    if (query.includes('gift') || query.includes('present')) {
      return 'gift';
    }
    if (query.includes('custom') || query.includes('personalized') || query.includes('made to order')) {
      return 'custom';
    }
    if (query.includes('cheap') || query.includes('affordable') || query.includes('budget')) {
      return 'budget';
    }
    if (query.includes('premium') || query.includes('luxury') || query.includes('high quality')) {
      return 'premium';
    }
    return 'browse';
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Remove stop words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
    
    return query
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 0);
  }

  /**
   * Generate synonyms for keywords
   */
  private async generateSynonyms(keywords: string[]): Promise<string[]> {
    // Simplified synonym mapping - in production, use a proper thesaurus API
    const synonymMap: Record<string, string[]> = {
      'handmade': ['artisan', 'crafted', 'handcrafted', 'artisanal', 'homemade'],
      'jewelry': ['jewellery', 'accessories', 'ornaments'],
      'art': ['artwork', 'painting', 'drawing', 'sculpture'],
      'pottery': ['ceramics', 'clay', 'earthenware'],
      'wood': ['wooden', 'timber', 'lumber'],
      'beautiful': ['gorgeous', 'stunning', 'lovely', 'attractive'],
      'unique': ['one-of-a-kind', 'special', 'distinctive', 'original'],
      'vintage': ['retro', 'antique', 'classic', 'old-fashioned']
    };

    const synonyms: string[] = [];
    
    keywords.forEach(keyword => {
      if (synonymMap[keyword]) {
        synonyms.push(...synonymMap[keyword]);
      }
    });

    return [...new Set(synonyms)]; // Remove duplicates
  }

  /**
   * Build processed query with expanded terms
   */
  private buildProcessedQuery(originalQuery: string, keywords: string[], synonyms: string[]): string {
    const allTerms = [...keywords, ...synonyms];
    return allTerms.join(' ');
  }

  /**
   * Execute semantic search against the database
   */
  private async executeSemanticSearch(searchQuery: SearchQuery, processedQuery: any): Promise<SearchResult[]> {
    try {
      // Build the base query
      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          price,
          images,
          category,
          tags,
          city,
          availability,
          created_at,
          seller:profiles!seller_id (
            id,
            full_name,
            avatar_url,
            seller_rating
          )
        `)
        .eq('status', 'active');

      // Apply text search
      if (searchQuery.query) {
        query = query.or(`title.ilike.%${searchQuery.query}%,description.ilike.%${searchQuery.query}%,tags.cs.{${searchQuery.query}}`);
      }

      // Apply filters
      if (searchQuery.filters) {
        if (searchQuery.filters.category) {
          query = query.eq('category', searchQuery.filters.category);
        }
        
        if (searchQuery.filters.city) {
          query = query.eq('city', searchQuery.filters.city);
        }
        
        if (searchQuery.filters.priceRange) {
          if (searchQuery.filters.priceRange.min) {
            query = query.gte('price', searchQuery.filters.priceRange.min);
          }
          if (searchQuery.filters.priceRange.max) {
            query = query.lte('price', searchQuery.filters.priceRange.max);
          }
        }
        
        if (searchQuery.filters.availability) {
          query = query.eq('availability', searchQuery.filters.availability);
        }
        
        if (searchQuery.filters.tags && searchQuery.filters.tags.length > 0) {
          query = query.overlaps('tags', searchQuery.filters.tags);
        }
      }

      // Apply pagination
      if (searchQuery.offset) {
        query = query.range(searchQuery.offset, (searchQuery.offset + (searchQuery.limit || 20)) - 1);
      } else {
        query = query.limit(searchQuery.limit || 20);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to SearchResult format
      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        images: item.images || [],
        seller: {
          id: item.seller?.id || '',
          name: item.seller?.full_name || 'Unknown Seller',
          avatar: item.seller?.avatar_url,
          rating: item.seller?.seller_rating || 0
        },
        category: item.category,
        tags: item.tags || [],
        city: item.city,
        availability: item.availability,
        relevanceScore: 0, // Will be calculated in ranking
        popularityScore: 0, // Will be calculated in ranking
        qualityScore: 0, // Will be calculated in ranking
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Database search failed:', error);
      return [];
    }
  }

  /**
   * Apply AI-powered ranking to search results
   */
  private async applyIntelligentRanking(results: SearchResult[], searchQuery: SearchQuery): Promise<SearchResult[]> {
    // Calculate relevance scores
    const rankedResults = results.map(result => {
      const relevanceScore = this.calculateRelevanceScore(result, searchQuery);
      const popularityScore = this.calculatePopularityScore(result);
      const qualityScore = this.calculateQualityScore(result);
      
      return {
        ...result,
        relevanceScore,
        popularityScore,
        qualityScore
      };
    });

    // Sort by composite score
    rankedResults.sort((a, b) => {
      const scoreA = this.calculateCompositeScore(a, searchQuery);
      const scoreB = this.calculateCompositeScore(b, searchQuery);
      return scoreB - scoreA;
    });

    return rankedResults;
  }

  /**
   * Calculate relevance score based on query match
   */
  private calculateRelevanceScore(result: SearchResult, searchQuery: SearchQuery): number {
    let score = 0;
    const query = searchQuery.query.toLowerCase();
    
    // Title match (highest weight)
    if (result.title.toLowerCase().includes(query)) {
      score += 50;
    }
    
    // Exact title match
    if (result.title.toLowerCase() === query) {
      score += 30;
    }
    
    // Description match
    if (result.description.toLowerCase().includes(query)) {
      score += 20;
    }
    
    // Tag matches
    const queryWords = query.split(' ');
    queryWords.forEach(word => {
      if (result.tags.some(tag => tag.toLowerCase().includes(word))) {
        score += 15;
      }
    });
    
    // Category match
    if (result.category.toLowerCase().includes(query)) {
      score += 25;
    }

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Calculate popularity score
   */
  private calculatePopularityScore(result: SearchResult): number {
    // This would be based on actual metrics like views, favorites, purchases
    // For now, use seller rating and recency as proxies
    let score = 0;
    
    // Seller rating contribution
    score += result.seller.rating * 10;
    
    // Recency bonus (newer items get slight boost)
    const daysSinceCreated = (Date.now() - new Date(result.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) {
      score += 10;
    } else if (daysSinceCreated < 30) {
      score += 5;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(result: SearchResult): number {
    let score = 0;
    
    // Image quality (more images = higher quality)
    score += Math.min(result.images.length * 10, 30);
    
    // Description length (detailed descriptions = higher quality)
    if (result.description.length > 200) {
      score += 20;
    } else if (result.description.length > 100) {
      score += 10;
    }
    
    // Tag richness
    score += Math.min(result.tags.length * 5, 25);
    
    // Seller rating
    score += result.seller.rating * 5;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate composite score for final ranking
   */
  private calculateCompositeScore(result: SearchResult, searchQuery: SearchQuery): number {
    // Weighted combination of different scores
    const relevanceWeight = 0.5;
    const popularityWeight = 0.3;
    const qualityWeight = 0.2;
    
    return (
      result.relevanceScore * relevanceWeight +
      result.popularityScore * popularityWeight +
      result.qualityScore * qualityWeight
    );
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      const suggestions: SearchSuggestion[] = [];
      
      // Get popular search terms
      const { data: popularQueries } = await supabase
        .from('search_analytics')
        .select('query')
        .ilike('query', `%${query}%`)
        .limit(5);

      if (popularQueries) {
        popularQueries.forEach(item => {
          suggestions.push({
            text: item.query,
            type: 'query',
            popularity: Math.random() * 100 // Placeholder
          });
        });
      }

      // Get category suggestions
      const { data: categories } = await supabase
        .from('listings')
        .select('category')
        .ilike('category', `%${query}%`)
        .limit(3);

      if (categories) {
        categories.forEach(item => {
          suggestions.push({
            text: item.category,
            type: 'category',
            popularity: Math.random() * 100
          });
        });
      }

      return suggestions.slice(0, 8); // Limit to 8 suggestions
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }

  /**
   * Log search analytics
   */
  private async logSearchAnalytics(analytics: SearchAnalytics): Promise<void> {
    try {
      await supabase.from('search_analytics').insert({
        query_id: analytics.queryId,
        query: analytics.query,
        user_id: analytics.userId,
        session_id: analytics.sessionId,
        results_count: analytics.resultsCount,
        search_time: analytics.searchTime,
        filters: analytics.filters,
        timestamp: analytics.timestamp.toISOString()
      });
    } catch (error) {
      console.error('Failed to log search analytics:', error);
    }
  }

  /**
   * Track search result clicks
   */
  async trackResultClick(queryId: string, resultId: string, position: number): Promise<void> {
    try {
      await supabase.from('search_click_analytics').insert({
        query_id: queryId,
        result_id: resultId,
        position,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to track result click:', error);
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(timeRange: string = '24h'): Promise<{
    totalSearches: number;
    averageResultsCount: number;
    averageSearchTime: number;
    topQueries: { query: string; count: number }[];
    clickThroughRate: number;
  }> {
    try {
      const timeFilter = this.getTimeFilter(timeRange);
      
      const { data: analytics } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('timestamp', timeFilter);

      const { data: clicks } = await supabase
        .from('search_click_analytics')
        .select('query_id')
        .gte('timestamp', timeFilter);

      if (!analytics) {
        return {
          totalSearches: 0,
          averageResultsCount: 0,
          averageSearchTime: 0,
          topQueries: [],
          clickThroughRate: 0
        };
      }

      const totalSearches = analytics.length;
      const averageResultsCount = analytics.reduce((sum, a) => sum + a.results_count, 0) / totalSearches;
      const averageSearchTime = analytics.reduce((sum, a) => sum + a.search_time, 0) / totalSearches;
      
      // Calculate top queries
      const queryCount: Record<string, number> = {};
      analytics.forEach(a => {
        queryCount[a.query] = (queryCount[a.query] || 0) + 1;
      });
      
      const topQueries = Object.entries(queryCount)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate click-through rate
      const uniqueClickedQueries = new Set(clicks?.map(c => c.query_id) || []).size;
      const clickThroughRate = totalSearches > 0 ? (uniqueClickedQueries / totalSearches) * 100 : 0;

      return {
        totalSearches,
        averageResultsCount,
        averageSearchTime,
        topQueries,
        clickThroughRate
      };
    } catch (error) {
      console.error('Failed to get search analytics:', error);
      return {
        totalSearches: 0,
        averageResultsCount: 0,
        averageSearchTime: 0,
        topQueries: [],
        clickThroughRate: 0
      };
    }
  }

  /**
   * Helper methods
   */
  private createAnalytics(
    queryId: string,
    searchQuery: SearchQuery,
    resultsCount: number,
    startTime: number,
    sessionId: string
  ): SearchAnalytics {
    return {
      queryId,
      query: searchQuery.query,
      userId: searchQuery.userId,
      sessionId,
      resultsCount,
      clickedResults: [],
      searchTime: Date.now() - startTime,
      filters: searchQuery.filters || {},
      timestamp: new Date()
    };
  }

  private generateQueryId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    // In a real app, this would come from session management
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCacheKey(searchQuery: SearchQuery): string {
    return JSON.stringify({
      query: searchQuery.query,
      filters: searchQuery.filters,
      limit: searchQuery.limit,
      offset: searchQuery.offset
    });
  }

  private getTimeFilter(range: string): string {
    const now = new Date();
    switch (range) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.searchHistory.clear();
    this.queryCache.clear();
  }
}

// Export singleton instance
export const semanticSearchEngine = SemanticSearchEngine.getInstance();
