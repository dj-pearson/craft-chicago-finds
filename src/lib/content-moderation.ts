// Prohibited keywords and patterns for automated content moderation
export const PROHIBITED_KEYWORDS = {
  weapons: [
    'gun', 'guns', 'firearm', 'rifle', 'pistol', 'ammunition', 'ammo',
    'explosive', 'grenade', 'knife', 'switchblade', 'brass knuckles',
    'taser', 'pepper spray', 'nunchucks'
  ],
  drugs: [
    'marijuana', 'cannabis', 'weed', 'cbd oil', 'thc', 'cocaine', 'heroin',
    'methamphetamine', 'prescription medication', 'pills', 'drugs'
  ],
  alcohol: [
    'beer', 'wine', 'liquor', 'vodka', 'whiskey', 'bourbon', 'rum',
    'tequila', 'alcoholic beverage', 'moonshine', 'homebrew'
  ],
  tobacco: [
    'cigarette', 'cigar', 'tobacco', 'vape', 'e-cigarette', 'juul',
    'smoking', 'nicotine'
  ],
  adult: [
    'pornography', 'adult content', 'sex toy', 'explicit', 'xxx'
  ],
  animals: [
    'live animal', 'puppy mill', 'exotic pet', 'endangered species'
  ],
  counterfeit: [
    'replica', 'knock-off', 'fake', 'counterfeit', 'imitation designer',
    'authentic replica', 'aaa quality'
  ],
  regulated: [
    'prescription', 'medical device', 'contact lens', 'breast milk',
    'human remains', 'body parts'
  ]
};

export const FOOD_SAFETY_KEYWORDS = [
  'homemade food', 'baked goods', 'candy', 'chocolate', 'cookies',
  'cake', 'bread', 'jam', 'preserves', 'sauce', 'salsa', 'pickle',
  'fermented', 'canned goods', 'prepared food', 'meal prep'
];

export interface ModerationResult {
  flagged: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  requiresManualReview: boolean;
}

/**
 * Analyzes listing content for prohibited items and policy violations
 */
export function moderateListingContent(
  title: string,
  description: string,
  tags: string[] = [],
  category?: string
): ModerationResult {
  const content = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
  const result: ModerationResult = {
    flagged: false,
    reasons: [],
    severity: 'low',
    confidence: 0,
    requiresManualReview: false
  };

  // Check for prohibited items
  for (const [category, keywords] of Object.entries(PROHIBITED_KEYWORDS)) {
    const matches = keywords.filter(keyword => content.includes(keyword.toLowerCase()));
    
    if (matches.length > 0) {
      result.flagged = true;
      result.reasons.push(`Possible ${category}: ${matches.join(', ')}`);
      result.severity = 'high';
      result.confidence = Math.min(100, matches.length * 30);
    }
  }

  // Check for food items requiring safety information
  const isFoodItem = FOOD_SAFETY_KEYWORDS.some(keyword => 
    content.includes(keyword.toLowerCase())
  );

  if (isFoodItem) {
    const hasAllergenInfo = /allergen|allergy|contains|ingredients/i.test(content);
    const hasStorageInfo = /refrigerat|freeze|store|shelf[\s-]?life/i.test(content);
    
    if (!hasAllergenInfo || !hasStorageInfo) {
      result.flagged = true;
      result.reasons.push('Food item missing required safety information (allergens, storage)');
      result.severity = 'medium';
      result.confidence = 80;
      result.requiresManualReview = true;
    }
  }

  // Check for potential scam indicators
  const scamPatterns = [
    /100% guaranteed/i,
    /no refund/i,
    /cash only/i,
    /wire transfer/i,
    /money order/i,
    /bitcoin/i,
    /cryptocurrency/i,
    /limited time offer/i,
    /act now/i,
    /incredible deal/i
  ];

  const scamMatches = scamPatterns.filter(pattern => pattern.test(content));
  if (scamMatches.length >= 2) {
    result.flagged = true;
    result.reasons.push('Potential scam indicators detected');
    result.severity = 'medium';
    result.confidence = Math.min(90, scamMatches.length * 25);
    result.requiresManualReview = true;
  }

  // Check for price manipulation
  if (/\$0\.01|\$0\.00|free.*shipping.*just.*pay/i.test(content)) {
    result.flagged = true;
    result.reasons.push('Suspicious pricing detected');
    result.severity = 'medium';
    result.confidence = 70;
  }

  // Auto-reject critical severity items
  if (result.severity === 'high' && result.confidence >= 60) {
    result.requiresManualReview = false; // Auto-reject, no manual review needed
  } else if (result.flagged) {
    result.requiresManualReview = true;
  }

  return result;
}

/**
 * Validates food safety requirements
 */
export function validateFoodSafety(description: string): {
  hasAllergenInfo: boolean;
  hasStorageInfo: boolean;
  hasIngredients: boolean;
  warnings: string[];
} {
  const desc = description.toLowerCase();
  
  return {
    hasAllergenInfo: /allergen|allergy|contains.*:|free from/i.test(description),
    hasStorageInfo: /refrigerat|freeze|store|shelf[\s-]?life|expir/i.test(description),
    hasIngredients: /ingredient|made with|contains/i.test(description),
    warnings: [
      !(/allergen|allergy/i.test(description)) ? 'Missing allergen information' : '',
      !(/refrigerat|freeze|store/i.test(description)) ? 'Missing storage instructions' : '',
      !(/ingredient|made with/i.test(description)) ? 'Missing ingredient list' : '',
    ].filter(Boolean)
  };
}

/**
 * Checks if content contains intellectual property violations
 */
export function checkIntellectualProperty(title: string, description: string): {
  flagged: boolean;
  reasons: string[];
} {
  const content = `${title} ${description}`;
  const reasons: string[] = [];

  // Check for common trademark violations
  const trademarkPatterns = [
    /\b(authentic|genuine|original|real)\s+(louis vuitton|gucci|prada|chanel|rolex|nike|adidas)\b/i,
    /\b(inspired by|similar to|like|style of)\s+[A-Z][a-z]+\b/i,
    /\bdesigner\s+(replica|inspired|style|look)\b/i
  ];

  trademarkPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      reasons.push('Potential trademark violation detected');
    }
  });

  // Check for Disney/character licensing issues
  if (/disney|mickey|minnie|marvel|star wars|frozen|princess/i.test(content)) {
    reasons.push('Possible licensed character usage (requires verification)');
  }

  return {
    flagged: reasons.length > 0,
    reasons: [...new Set(reasons)] // Remove duplicates
  };
}
