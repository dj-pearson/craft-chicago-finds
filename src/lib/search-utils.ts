import { supabase } from "@/integrations/supabase/client";

// Common synonyms for search terms
const SEARCH_SYNONYMS: Record<string, string[]> = {
  // Materials
  wood: ["wooden", "timber", "lumber", "hardwood"],
  metal: ["metallic", "steel", "iron", "aluminum", "brass", "copper"],
  ceramic: ["pottery", "clay", "porcelain", "earthenware"],
  glass: ["crystal", "glassware"],
  fabric: ["textile", "cloth", "material"],
  leather: ["hide", "suede"],
  plastic: ["acrylic", "resin"],

  // Styles
  modern: ["contemporary", "minimalist", "sleek"],
  vintage: ["retro", "antique", "classic", "old-fashioned"],
  rustic: ["farmhouse", "country", "rural"],
  boho: ["bohemian", "hippie", "free-spirited"],
  industrial: ["urban", "loft", "warehouse"],
  scandinavian: ["nordic", "scandi"],

  // Categories
  jewelry: [
    "jewellery",
    "accessories",
    "rings",
    "necklaces",
    "earrings",
    "bracelets",
  ],
  candle: ["candles", "wax", "scented"],
  art: ["artwork", "painting", "drawing", "print"],
  decor: ["decoration", "decorative", "ornament"],
  home: ["house", "interior"],
  gift: ["present", "souvenir"],

  // Attributes
  handmade: ["handcrafted", "artisan", "crafted", "homemade"],
  organic: ["natural", "eco-friendly", "sustainable"],
  custom: ["personalized", "bespoke", "made-to-order"],
  unique: ["one-of-a-kind", "original", "exclusive"],
  small: ["mini", "tiny", "petite", "compact"],
  large: ["big", "huge", "oversized"],
};

// Common typos and corrections
const TYPO_CORRECTIONS: Record<string, string> = {
  jewlery: "jewelry",
  jewellery: "jewelry",
  accesories: "accessories",
  handmaid: "handmade",
  orgainic: "organic",
  custome: "custom",
  uniqe: "unique",
  candel: "candle",
  candels: "candles",
  decore: "decor",
  woood: "wood",
  wodden: "wooden",
  metall: "metal",
  ceramik: "ceramic",
  lether: "leather",
  plastik: "plastic",
  bohoo: "boho",
  bohemian: "boho",
  rusitc: "rustic",
  morden: "modern",
  contempary: "contemporary",
  minimlist: "minimalist",
  vintag: "vintage",
  antik: "antique",
  clasic: "classic",
  industrail: "industrial",
  scandinavain: "scandinavian",
  nordik: "nordic",
};

// Price parsing patterns
const PRICE_PATTERNS = [
  /under\s*\$?(\d+)/i,
  /below\s*\$?(\d+)/i,
  /less\s+than\s*\$?(\d+)/i,
  /\$?(\d+)\s*or\s+less/i,
  /\$?(\d+)\s*-\s*\$?(\d+)/i,
  /between\s*\$?(\d+)\s*and\s*\$?(\d+)/i,
  /over\s*\$?(\d+)/i,
  /above\s*\$?(\d+)/i,
  /more\s+than\s*\$?(\d+)/i,
  /\$?(\d+)\s*or\s+more/i,
];

export interface ParsedSearch {
  keywords: string[];
  synonyms: string[];
  correctedQuery: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  materials?: string[];
  styles?: string[];
  attributes?: string[];
}

export function parseNaturalLanguageSearch(query: string): ParsedSearch {
  let cleanQuery = query.toLowerCase().trim();
  const originalQuery = cleanQuery;

  // Extract price information
  let priceRange: { min?: number; max?: number } | undefined;

  for (const pattern of PRICE_PATTERNS) {
    const match = cleanQuery.match(pattern);
    if (match) {
      if (
        pattern.source.includes("under") ||
        pattern.source.includes("below") ||
        pattern.source.includes("less")
      ) {
        priceRange = { max: parseInt(match[1]) };
      } else if (
        pattern.source.includes("over") ||
        pattern.source.includes("above") ||
        pattern.source.includes("more")
      ) {
        priceRange = { min: parseInt(match[1]) };
      } else if (match[2]) {
        priceRange = { min: parseInt(match[1]), max: parseInt(match[2]) };
      }

      // Remove price info from query
      cleanQuery = cleanQuery.replace(match[0], "").trim();
      break;
    }
  }

  // Apply typo corrections
  let correctedQuery = cleanQuery;
  for (const [typo, correction] of Object.entries(TYPO_CORRECTIONS)) {
    const regex = new RegExp(`\\b${typo}\\b`, "gi");
    correctedQuery = correctedQuery.replace(regex, correction);
  }

  // Extract keywords
  const words = correctedQuery.split(/\s+/).filter((word) => word.length > 1);

  // Categorize words
  const materials: string[] = [];
  const styles: string[] = [];
  const attributes: string[] = [];
  const keywords: string[] = [];
  const synonyms: string[] = [];

  const materialKeywords = [
    "wood",
    "wooden",
    "metal",
    "ceramic",
    "glass",
    "fabric",
    "leather",
    "plastic",
    "acrylic",
    "resin",
  ];
  const styleKeywords = [
    "modern",
    "vintage",
    "rustic",
    "boho",
    "industrial",
    "scandinavian",
    "minimalist",
    "contemporary",
  ];
  const attributeKeywords = [
    "handmade",
    "organic",
    "custom",
    "unique",
    "eco-friendly",
    "sustainable",
    "natural",
  ];

  for (const word of words) {
    // Check if it's a material
    if (materialKeywords.some((m) => word.includes(m) || m.includes(word))) {
      materials.push(word);
    }
    // Check if it's a style
    else if (styleKeywords.some((s) => word.includes(s) || s.includes(word))) {
      styles.push(word);
    }
    // Check if it's an attribute
    else if (
      attributeKeywords.some((a) => word.includes(a) || a.includes(word))
    ) {
      attributes.push(word);
    } else {
      keywords.push(word);
    }

    // Add synonyms
    for (const [key, syns] of Object.entries(SEARCH_SYNONYMS)) {
      if (word.includes(key) || key.includes(word)) {
        synonyms.push(...syns);
      }
    }
  }

  return {
    keywords: [...new Set(keywords)],
    synonyms: [...new Set(synonyms)],
    correctedQuery,
    priceRange,
    materials: [...new Set(materials)],
    styles: [...new Set(styles)],
    attributes: [...new Set(attributes)],
  };
}

export function buildEnhancedSearchQuery(
  baseQuery: any,
  searchQuery: string,
  parsedSearch: ParsedSearch
) {
  if (!searchQuery && !parsedSearch.keywords.length) {
    return baseQuery;
  }

  // Build search terms including synonyms
  const allSearchTerms = [
    ...parsedSearch.keywords,
    ...parsedSearch.synonyms,
    ...parsedSearch.materials,
    ...parsedSearch.styles,
    ...parsedSearch.attributes,
  ].filter(Boolean);

  if (allSearchTerms.length === 0) {
    return baseQuery;
  }

  // Create comprehensive search across multiple fields
  const searchConditions = allSearchTerms.map((term) => {
    return [
      `title.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `tags.cs.{${term}}`,
    ].join(",");
  });

  // Combine all search conditions with OR
  const combinedSearch = searchConditions
    .map((condition) => `(${condition})`)
    .join(",");

  return baseQuery.or(combinedSearch);
}

export function calculateSearchRelevance(
  listing: any,
  searchQuery: string,
  parsedSearch: ParsedSearch
): number {
  let score = 0;
  const title = (listing.title || "").toLowerCase();
  const description = (listing.description || "").toLowerCase();
  const tags = (listing.tags || []).map((tag: string) => tag.toLowerCase());

  const allSearchTerms = [
    searchQuery.toLowerCase(),
    ...parsedSearch.keywords,
    ...parsedSearch.materials,
    ...parsedSearch.styles,
    ...parsedSearch.attributes,
  ].filter(Boolean);

  for (const term of allSearchTerms) {
    // Title matches are most important
    if (title.includes(term)) {
      score += title === term ? 100 : 50; // Exact match gets higher score
    }

    // Tag matches are very important
    if (tags.some((tag: string) => tag.includes(term))) {
      score += 30;
    }

    // Description matches
    if (description.includes(term)) {
      score += 10;
    }
  }

  // Boost for exact phrase matches
  if (title.includes(searchQuery.toLowerCase())) {
    score += 75;
  }
  if (description.includes(searchQuery.toLowerCase())) {
    score += 25;
  }

  // Boost for multiple term matches
  const termMatches = allSearchTerms.filter(
    (term) =>
      title.includes(term) ||
      description.includes(term) ||
      tags.some((tag: string) => tag.includes(term))
  ).length;

  score += termMatches * 5;

  return score;
}

export async function getSearchSuggestions(
  query: string,
  cityId: string,
  limit: number = 8
): Promise<Array<{ type: string; text: string; count?: number }>> {
  const parsedSearch = parseNaturalLanguageSearch(query);
  const suggestions: Array<{ type: string; text: string; count?: number }> = [];

  try {
    // Get category suggestions
    const { data: categories } = await supabase
      .from("categories")
      .select("name")
      .eq("city_id", cityId)
      .eq("is_active", true)
      .or(
        parsedSearch.keywords
          .map((keyword) => `name.ilike.%${keyword}%`)
          .join(",")
      )
      .limit(3);

    if (categories) {
      categories.forEach((cat) => {
        suggestions.push({
          type: "category",
          text: cat.name,
        });
      });
    }

    // Get tag suggestions from actual listings
    const { data: listings } = await supabase
      .from("listings")
      .select("tags")
      .eq("city_id", cityId)
      .eq("status", "active")
      .not("tags", "is", null)
      .limit(20);

    if (listings) {
      const tagCounts = new Map<string, number>();

      listings.forEach((listing) => {
        if (listing.tags && Array.isArray(listing.tags)) {
          listing.tags.forEach((tag: string) => {
            if (
              tag &&
              parsedSearch.keywords.some((keyword) =>
                tag.toLowerCase().includes(keyword.toLowerCase())
              )
            ) {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
          });
        }
      });

      // Sort by frequency and add top suggestions
      const sortedTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);

      sortedTags.forEach(([tag, count]) => {
        suggestions.push({
          type: "tag",
          text: tag,
          count,
        });
      });
    }

    // Add corrected query suggestion if there were corrections
    if (parsedSearch.correctedQuery !== query.toLowerCase()) {
      suggestions.unshift({
        type: "correction",
        text: parsedSearch.correctedQuery,
      });
    }
  } catch (error) {
    console.error("Error getting search suggestions:", error);
  }

  return suggestions.slice(0, limit);
}
