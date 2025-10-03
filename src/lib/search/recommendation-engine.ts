import { supabase } from '@/integrations/supabase/client';
import { SearchResult } from './semantic-search-engine';

export interface UserProfile {
  userId: string;
  preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    styles: string[];
    colors: string[];
    materials: string[];
  };
  behavior: {
    viewedItems: string[];
    purchasedItems: string[];
    searchHistory: string[];
    favoriteCategories: string[];
    avgSessionDuration: number;
    clickThroughRate: number;
  };
  demographics: {
    city?: string;
    ageRange?: string;
    interests?: string[];
  };
}

export interface RecommendationRequest {
  userId?: string;
  sessionId?: string;
  context: 'homepage' | 'product_page' | 'search_results' | 'cart' | 'checkout';
  currentItem?: string; // For product page recommendations
  limit?: number;
  excludeItems?: string[];
}

export interface Recommendation {
  item: SearchResult;
  score: number;
  reason: string;
  type: 'collaborative' | 'content_based' | 'trending' | 'personalized' | 'similar_users';
  confidence: number;
}

export interface RecommendationAnalytics {
  recommendationId: string;
  userId?: string;
  sessionId: string;
  context: string;
  recommendedItems: string[];
  clickedItems: string[];
  purchasedItems: string[];
  timestamp: Date;
}

export class AIRecommendationEngine {
  private static instance: AIRecommendationEngine;
  private userProfiles: Map<string, UserProfile> = new Map();
  private itemSimilarities: Map<string, Map<string, number>> = new Map();
  private trendingItems: string[] = [];
  private lastTrendingUpdate = 0;

  static getInstance(): AIRecommendationEngine {
    if (!AIRecommendationEngine.instance) {
      AIRecommendationEngine.instance = new AIRecommendationEngine();
    }
    return AIRecommendationEngine.instance;
  }

  /**
   * Initialize the recommendation engine
   */
  async initialize(): Promise<void> {
    await this.loadTrendingItems();
    await this.precomputeItemSimilarities();
    console.log('AI Recommendation Engine initialized');
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(request: RecommendationRequest): Promise<{
    recommendations: Recommendation[];
    analytics: RecommendationAnalytics;
  }> {
    const recommendationId = this.generateRecommendationId();
    const sessionId = request.sessionId || this.generateSessionId();

    try {
      // Get user profile if available
      let userProfile: UserProfile | null = null;
      if (request.userId) {
        userProfile = await this.getUserProfile(request.userId);
      }

      // Generate recommendations based on context
      let recommendations: Recommendation[] = [];

      switch (request.context) {
        case 'homepage':
          recommendations = await this.getHomepageRecommendations(userProfile, request.limit || 12);
          break;
        case 'product_page':
          recommendations = await this.getProductPageRecommendations(request.currentItem!, userProfile, request.limit || 6);
          break;
        case 'search_results':
          recommendations = await this.getSearchResultRecommendations(userProfile, request.limit || 4);
          break;
        case 'cart':
          recommendations = await this.getCartRecommendations(userProfile, request.excludeItems || [], request.limit || 4);
          break;
        case 'checkout':
          recommendations = await this.getCheckoutRecommendations(userProfile, request.excludeItems || [], request.limit || 3);
          break;
      }

      // Filter out excluded items
      if (request.excludeItems) {
        recommendations = recommendations.filter(rec => 
          !request.excludeItems!.includes(rec.item.id)
        );
      }

      // Sort by score and limit results
      recommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, request.limit || 10);

      // Create analytics
      const analytics: RecommendationAnalytics = {
        recommendationId,
        userId: request.userId,
        sessionId,
        context: request.context,
        recommendedItems: recommendations.map(r => r.item.id),
        clickedItems: [],
        purchasedItems: [],
        timestamp: new Date()
      };

      // Log analytics
      await this.logRecommendationAnalytics(analytics);

      return { recommendations, analytics };
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return {
        recommendations: [],
        analytics: {
          recommendationId,
          userId: request.userId,
          sessionId,
          context: request.context,
          recommendedItems: [],
          clickedItems: [],
          purchasedItems: [],
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get homepage recommendations
   */
  private async getHomepageRecommendations(userProfile: UserProfile | null, limit: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (userProfile) {
      // Personalized recommendations for logged-in users
      
      // 1. Based on user's favorite categories (40% weight)
      const categoryRecs = await this.getCategoryBasedRecommendations(userProfile, Math.ceil(limit * 0.4));
      recommendations.push(...categoryRecs);

      // 2. Collaborative filtering (30% weight)
      const collaborativeRecs = await this.getCollaborativeRecommendations(userProfile, Math.ceil(limit * 0.3));
      recommendations.push(...collaborativeRecs);

      // 3. Trending items (20% weight)
      const trendingRecs = await this.getTrendingRecommendations(Math.ceil(limit * 0.2));
      recommendations.push(...trendingRecs);

      // 4. Similar to recently viewed (10% weight)
      const recentRecs = await this.getRecentlyViewedSimilar(userProfile, Math.ceil(limit * 0.1));
      recommendations.push(...recentRecs);
    } else {
      // Anonymous user recommendations
      
      // 1. Trending items (60% weight)
      const trendingRecs = await this.getTrendingRecommendations(Math.ceil(limit * 0.6));
      recommendations.push(...trendingRecs);

      // 2. Popular in each category (40% weight)
      const popularRecs = await this.getPopularByCategory(Math.ceil(limit * 0.4));
      recommendations.push(...popularRecs);
    }

    return this.deduplicateRecommendations(recommendations);
  }

  /**
   * Get product page recommendations (similar items, frequently bought together)
   */
  private async getProductPageRecommendations(itemId: string, userProfile: UserProfile | null, limit: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 1. Similar items based on content (50% weight)
    const similarRecs = await this.getSimilarItems(itemId, Math.ceil(limit * 0.5));
    recommendations.push(...similarRecs);

    // 2. Frequently bought together (30% weight)
    const frequentRecs = await this.getFrequentlyBoughtTogether(itemId, Math.ceil(limit * 0.3));
    recommendations.push(...frequentRecs);

    // 3. From same seller (20% weight)
    const sellerRecs = await this.getSameSellerRecommendations(itemId, Math.ceil(limit * 0.2));
    recommendations.push(...sellerRecs);

    return this.deduplicateRecommendations(recommendations);
  }

  /**
   * Get search result recommendations
   */
  private async getSearchResultRecommendations(userProfile: UserProfile | null, limit: number): Promise<Recommendation[]> {
    // Show trending items in the search context
    return await this.getTrendingRecommendations(limit);
  }

  /**
   * Get cart recommendations (complementary items)
   */
  private async getCartRecommendations(userProfile: UserProfile | null, cartItems: string[], limit: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Get complementary items for each cart item
    for (const itemId of cartItems) {
      const complementary = await this.getComplementaryItems(itemId, Math.ceil(limit / cartItems.length));
      recommendations.push(...complementary);
    }

    return this.deduplicateRecommendations(recommendations);
  }

  /**
   * Get checkout recommendations (last chance items)
   */
  private async getCheckoutRecommendations(userProfile: UserProfile | null, cartItems: string[], limit: number): Promise<Recommendation[]> {
    // Show small, affordable add-on items
    return await this.getAddOnRecommendations(cartItems, limit);
  }

  /**
   * Get category-based recommendations
   */
  private async getCategoryBasedRecommendations(userProfile: UserProfile, limit: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    try {
      for (const category of userProfile.preferences.categories.slice(0, 3)) {
        const { data } = await supabase
          .from('listings')
          .select(`
            id, title, description, price, images, category, tags, city, availability, created_at,
            seller:profiles!seller_id (id, full_name, avatar_url, seller_rating)
          `)
          .eq('category', category)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(Math.ceil(limit / 3));

        if (data) {
          data.forEach(item => {
            recommendations.push({
              item: this.transformToSearchResult(item),
              score: 80 + Math.random() * 20,
              reason: `Popular in ${category}`,
              type: 'content_based',
              confidence: 0.8
            });
          });
        }
      }
    } catch (error) {
      console.error('Failed to get category-based recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Get collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(userProfile: UserProfile, limit: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    try {
      // Find users with similar behavior
      const similarUsers = await this.findSimilarUsers(userProfile.userId);
      
      // Get items liked by similar users that this user hasn't seen
      for (const similarUserId of similarUsers.slice(0, 5)) {
        const { data } = await supabase
          .from('user_interactions')
          .select('listing_id')
          .eq('user_id', similarUserId)
          .eq('interaction_type', 'favorite')
          .not('listing_id', 'in', `(${userProfile.behavior.viewedItems.join(',')})`);

        if (data) {
          for (const interaction of data.slice(0, Math.ceil(limit / 5))) {
            const { data: listing } = await supabase
              .from('listings')
              .select(`
                id, title, description, price, images, category, tags, city, availability, created_at,
                seller:profiles!seller_id (id, full_name, avatar_url, seller_rating)
              `)
              .eq('id', interaction.listing_id)
              .eq('status', 'active')
              .single();

            if (listing) {
              recommendations.push({
                item: this.transformToSearchResult(listing),
                score: 70 + Math.random() * 20,
                reason: 'Liked by similar users',
                type: 'collaborative',
                confidence: 0.7
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get collaborative recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Get trending recommendations
   */
  private async getTrendingRecommendations(limit: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    try {
      // Update trending items if needed
      if (Date.now() - this.lastTrendingUpdate > 3600000) { // 1 hour
        await this.loadTrendingItems();
      }

      for (const itemId of this.trendingItems.slice(0, limit)) {
        const { data: listing } = await supabase
          .from('listings')
          .select(`
            id, title, description, price, images, category, tags, city, availability, created_at,
            seller:profiles!seller_id (id, full_name, avatar_url, seller_rating)
          `)
          .eq('id', itemId)
          .eq('status', 'active')
          .single();

        if (listing) {
          recommendations.push({
            item: this.transformToSearchResult(listing),
            score: 90 + Math.random() * 10,
            reason: 'Trending now',
            type: 'trending',
            confidence: 0.9
          });
        }
      }
    } catch (error) {
      console.error('Failed to get trending recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Get similar items based on content
   */
  private async getSimilarItems(itemId: string, limit: number): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    try {
      // Get the source item
      const { data: sourceItem } = await supabase
        .from('listings')
        .select('category, tags, price')
        .eq('id', itemId)
        .single();

      if (!sourceItem) return recommendations;

      // Find similar items
      const { data } = await supabase
        .from('listings')
        .select(`
          id, title, description, price, images, category, tags, city, availability, created_at,
          seller:profiles!seller_id (id, full_name, avatar_url, seller_rating)
        `)
        .eq('category', sourceItem.category)
        .neq('id', itemId)
        .eq('status', 'active')
        .limit(limit * 2); // Get more to filter by similarity

      if (data) {
        // Calculate similarity scores
        const scoredItems = data.map(item => ({
          item,
          similarity: this.calculateContentSimilarity(sourceItem, item)
        }));

        // Sort by similarity and take top items
        scoredItems
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit)
          .forEach(({ item, similarity }) => {
            recommendations.push({
              item: this.transformToSearchResult(item),
              score: similarity * 100,
              reason: 'Similar to current item',
              type: 'content_based',
              confidence: similarity
            });
          });
      }
    } catch (error) {
      console.error('Failed to get similar items:', error);
    }

    return recommendations;
  }

  /**
   * Calculate content similarity between items
   */
  private calculateContentSimilarity(item1: any, item2: any): number {
    let similarity = 0;

    // Category match (40% weight)
    if (item1.category === item2.category) {
      similarity += 0.4;
    }

    // Tag overlap (40% weight)
    const tags1 = item1.tags || [];
    const tags2 = item2.tags || [];
    const commonTags = tags1.filter((tag: string) => tags2.includes(tag));
    const tagSimilarity = commonTags.length / Math.max(tags1.length, tags2.length, 1);
    similarity += tagSimilarity * 0.4;

    // Price similarity (20% weight)
    const priceDiff = Math.abs(item1.price - item2.price);
    const avgPrice = (item1.price + item2.price) / 2;
    const priceSimilarity = Math.max(0, 1 - (priceDiff / avgPrice));
    similarity += priceSimilarity * 0.2;

    return similarity;
  }

  /**
   * Get user profile with behavior analysis
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Check cache first
      if (this.userProfiles.has(userId)) {
        return this.userProfiles.get(userId)!;
      }

      // Build user profile from various data sources
      const profile: UserProfile = {
        userId,
        preferences: {
          categories: [],
          priceRange: { min: 0, max: 1000 },
          styles: [],
          colors: [],
          materials: []
        },
        behavior: {
          viewedItems: [],
          purchasedItems: [],
          searchHistory: [],
          favoriteCategories: [],
          avgSessionDuration: 0,
          clickThroughRate: 0
        },
        demographics: {}
      };

      // Get user interactions
      const { data: interactions } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (interactions) {
        profile.behavior.viewedItems = interactions
          .filter(i => i.interaction_type === 'view')
          .map(i => i.listing_id);
        
        profile.behavior.purchasedItems = interactions
          .filter(i => i.interaction_type === 'purchase')
          .map(i => i.listing_id);
      }

      // Get search history
      const { data: searches } = await supabase
        .from('search_analytics')
        .select('query')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (searches) {
        profile.behavior.searchHistory = searches.map(s => s.query);
      }

      // Analyze preferences from behavior
      await this.analyzeUserPreferences(profile);

      // Cache the profile
      this.userProfiles.set(userId, profile);

      return profile;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Analyze user preferences from behavior
   */
  private async analyzeUserPreferences(profile: UserProfile): Promise<void> {
    try {
      // Get categories from viewed/purchased items
      if (profile.behavior.viewedItems.length > 0) {
        const { data: items } = await supabase
          .from('listings')
          .select('category, tags, price')
          .in('id', profile.behavior.viewedItems);

        if (items) {
          // Extract favorite categories
          const categoryCount: Record<string, number> = {};
          items.forEach(item => {
            categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
          });

          profile.preferences.categories = Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([category]) => category);

          // Extract price range preferences
          const prices = items.map(item => item.price).sort((a, b) => a - b);
          if (prices.length > 0) {
            profile.preferences.priceRange = {
              min: prices[Math.floor(prices.length * 0.1)], // 10th percentile
              max: prices[Math.floor(prices.length * 0.9)]  // 90th percentile
            };
          }

          // Extract tag preferences
          const tagCount: Record<string, number> = {};
          items.forEach(item => {
            (item.tags || []).forEach((tag: string) => {
              tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
          });

          const topTags = Object.entries(tagCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([tag]) => tag);

          // Categorize tags into styles, colors, materials
          profile.preferences.styles = topTags.filter(tag => 
            ['vintage', 'modern', 'rustic', 'minimalist', 'bohemian'].includes(tag.toLowerCase())
          );
          
          profile.preferences.colors = topTags.filter(tag => 
            ['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'pink'].includes(tag.toLowerCase())
          );
          
          profile.preferences.materials = topTags.filter(tag => 
            ['wood', 'metal', 'ceramic', 'glass', 'fabric', 'leather'].includes(tag.toLowerCase())
          );
        }
      }
    } catch (error) {
      console.error('Failed to analyze user preferences:', error);
    }
  }

  /**
   * Helper methods
   */
  private async loadTrendingItems(): Promise<void> {
    try {
      // Get trending items based on recent interactions
      const { data } = await supabase
        .from('user_interactions')
        .select('listing_id, COUNT(*) as interaction_count')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .group('listing_id')
        .order('interaction_count', { ascending: false })
        .limit(50);

      if (data) {
        this.trendingItems = data.map(item => item.listing_id);
      }

      this.lastTrendingUpdate = Date.now();
    } catch (error) {
      console.error('Failed to load trending items:', error);
    }
  }

  private async precomputeItemSimilarities(): Promise<void> {
    // This would be a background process to precompute item similarities
    // For now, we'll compute them on-demand
    console.log('Item similarities will be computed on-demand');
  }

  private async findSimilarUsers(userId: string): Promise<string[]> {
    // Simplified similar user finding - in production, use more sophisticated algorithms
    try {
      const { data } = await supabase
        .from('user_interactions')
        .select('user_id')
        .neq('user_id', userId)
        .limit(20);

      return data?.map(item => item.user_id) || [];
    } catch (error) {
      console.error('Failed to find similar users:', error);
      return [];
    }
  }

  private transformToSearchResult(item: any): SearchResult {
    return {
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
      relevanceScore: 0,
      popularityScore: 0,
      qualityScore: 0,
      createdAt: item.created_at
    };
  }

  private deduplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.item.id)) {
        return false;
      }
      seen.add(rec.item.id);
      return true;
    });
  }

  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async logRecommendationAnalytics(analytics: RecommendationAnalytics): Promise<void> {
    try {
      await supabase.from('recommendation_analytics').insert({
        recommendation_id: analytics.recommendationId,
        user_id: analytics.userId,
        session_id: analytics.sessionId,
        context: analytics.context,
        recommended_items: analytics.recommendedItems,
        timestamp: analytics.timestamp.toISOString()
      });
    } catch (error) {
      console.error('Failed to log recommendation analytics:', error);
    }
  }

  // Placeholder methods for additional recommendation types
  private async getRecentlyViewedSimilar(userProfile: UserProfile, limit: number): Promise<Recommendation[]> {
    return [];
  }

  private async getPopularByCategory(limit: number): Promise<Recommendation[]> {
    return [];
  }

  private async getFrequentlyBoughtTogether(itemId: string, limit: number): Promise<Recommendation[]> {
    return [];
  }

  private async getSameSellerRecommendations(itemId: string, limit: number): Promise<Recommendation[]> {
    return [];
  }

  private async getComplementaryItems(itemId: string, limit: number): Promise<Recommendation[]> {
    return [];
  }

  private async getAddOnRecommendations(cartItems: string[], limit: number): Promise<Recommendation[]> {
    return [];
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.userProfiles.clear();
    this.itemSimilarities.clear();
    this.trendingItems = [];
  }
}

// Export singleton instance
export const recommendationEngine = AIRecommendationEngine.getInstance();
