/**
 * Category-Specific SEO Content
 * Intro paragraphs and FAQs optimized for each product category
 */

import { FAQItem } from './FAQSection';

// Category Introduction Content (150-200 words each)
export const categoryIntros: Record<string, { title: string; description: string }> = {
  ceramics: {
    title: "Handmade Ceramics from Chicago Artisans",
    description: "Discover one-of-a-kind ceramic pieces from Chicago's thriving pottery community. From functional mugs and bowls to sculptural art, our local makers create beautiful, durable pottery using traditional and contemporary techniques. Each piece is handcrafted in Chicago studios, with many offering same-day pickup. Chicago has a rich ceramic arts heritage, with neighborhoods like Pilsen and Logan Square serving as hubs for pottery studios and community kilns. Many of our ceramic artists are graduates of the School of the Art Institute of Chicago (SAIC) or have trained at premier local studios. Whether you're looking for a unique coffee mug, a handthrown vase, or a statement sculpture, you'll find authentic Chicago-made ceramics here. Our makers use locally-sourced clay when possible and employ sustainable firing practices. With over 38 ceramic artists on our platform, you can browse hundreds of unique pieces and support Chicago's vibrant pottery community."
  },

  jewelry: {
    title: "Handmade Jewelry from Chicago Makers",
    description: "Explore stunning handmade jewelry created by Chicago's talented artisan jewelers. Our 45+ local jewelry makers craft everything from delicate minimalist pieces to bold statement jewelry using precious metals, gemstones, and innovative materials. Each piece is designed and handcrafted in Chicago neighborhoods like Wicker Park, Logan Square, and Pilsen. Chicago's jewelry scene is known for its diversity – you'll find contemporary geometric designs, vintage-inspired pieces, nature-themed jewelry, and culturally-influenced creations. Many makers offer custom design services and can create bespoke pieces for engagements, weddings, or special occasions. Our artisans work in sterling silver, 14k gold, brass, copper, and mixed metals, incorporating ethically-sourced gemstones and sustainable materials. Whether you're looking for everyday earrings, a unique engagement ring, or a gift that tells a story, our Chicago jewelry makers combine traditional metalsmithing techniques with contemporary design sensibilities to create wearable art."
  },

  "home-decor": {
    title: "Chicago Handmade Home Decor & Furnishings",
    description: "Transform your space with handmade home decor from Chicago's creative makers. Our 52+ local artisans craft unique pieces that add personality and warmth to any room – from hand-poured candles and woven textiles to woodwork and wall art. Each item is made with care in Chicago studios, reflecting the city's diverse design aesthetic. Chicago makers bring a distinct urban-meets-artisan style to home decor, blending industrial elements with handcrafted details. You'll find Scandinavian-inspired minimalism, maximalist bohemian pieces, mid-century modern revival, and everything in between. Popular items include hand-poured soy candles with Chicago-inspired scents (like Lake Michigan breeze or urban garden), macramé wall hangings, handwoven throws and pillows, reclaimed wood furniture, and ceramic planters. Many makers offer same-day pickup, so you can refresh your space today. Supporting local home decor makers means getting truly unique pieces that you won't find in big-box stores, plus the story behind each handcrafted item."
  },

  art: {
    title: "Chicago Local Art & Prints",
    description: "Bring Chicago's vibrant art scene into your home with original artwork and prints from 40+ local artists. Our makers create paintings, illustrations, prints, photography, and mixed media pieces that capture the essence of Chicago life and beyond. From iconic skyline views to abstract contemporary pieces, Chicago neighborhoods to nature scenes, you'll find art that speaks to you. Chicago's art community is internationally recognized, and our platform features emerging and established artists working in diverse mediums and styles. Browse watercolor paintings of Chicago architecture, bold graphic prints, fine art photography of Lake Michigan, abstract expressionist canvases, digital illustrations, and limited edition screen prints. Many artists offer both original works and affordable prints, making Chicago art accessible at every price point. Several makers provide custom commission services for personalized artwork. When you purchase from local Chicago artists, you're supporting the creative community that makes this city culturally vibrant. Plus, with same-day pickup available from many artists, you can take home your new piece today."
  },

  candles: {
    title: "Hand-Poured Candles by Chicago Makers",
    description: "Fill your space with the warm glow and beautiful scents of hand-poured candles from Chicago artisans. Our local candle makers craft small-batch candles using natural soy wax, coconut wax, and beeswax, with phthalate-free fragrance oils and essential oils. Each candle is poured, labeled, and packaged by hand in Chicago neighborhoods. Chicago candle makers are known for creating unique scent profiles inspired by the city – think Lake Michigan breeze, Chicago craft beer notes, urban garden florals, and cozy winter cabin aromas. You'll also find classic scents like lavender, vanilla, coffee shop, fresh linen, and seasonal favorites. Our makers prioritize sustainability, using recyclable containers, natural waxes, and cotton or wood wicks. Many offer refill programs to reduce waste. Whether you're looking for a luxury candle for self-care, a housewarming gift, or candles for everyday ambiance, you'll find hand-poured quality that burns cleaner and longer than mass-produced alternatives. With same-day pickup available, you can enjoy your new candles tonight."
  },

  textiles: {
    title: "Handwoven Textiles & Fiber Arts from Chicago",
    description: "Discover the artistry of Chicago's textile makers who create beautiful handwoven, knitted, and sewn pieces using traditional and contemporary techniques. Our fiber artists craft everything from cozy blankets and scarves to wall hangings and wearable art. Each textile tells a story through color, pattern, and texture, made with care in Chicago studios. Chicago has a strong textile arts community, with makers specializing in weaving, quilting, knitting, crochet, embroidery, and fabric printing. You'll find chunky knit blankets perfect for Chicago winters, handwoven table runners and placemats, macramé wall art, screen-printed tea towels with Chicago themes, hand-dyed yarn and fiber for your own projects, and vintage textile upcycling. Many textile artists use sustainable materials – organic cotton, recycled fibers, naturally-dyed yarns, and ethically-sourced wool. The level of craftsmanship in handmade textiles far exceeds mass-produced items, with attention to detail in every stitch and weave. Support Chicago's fiber arts community and bring warmth and texture into your home with one-of-a-kind textile pieces."
  }
};

// Category-Specific FAQs
export const categoryFAQs: Record<string, FAQItem[]> = {
  ceramics: [
    {
      question: "What types of handmade ceramics are available in Chicago?",
      answer: "Chicago ceramic artists create functional pottery like mugs, bowls, plates, and serving dishes, as well as decorative pieces such as vases, planters, sculptural art, and wall hangings. You'll find everything from minimalist Scandinavian-inspired designs to bold, colorful pieces influenced by Chicago's diverse neighborhoods. Popular items include handthrown mugs ($25-$45), dinner plate sets ($80-$150), unique planters ($20-$60), and statement vases ($40-$120)."
    },
    {
      question: "How do I care for handmade pottery?",
      answer: "Most handmade pottery is dishwasher and microwave safe, but check individual product details. For longevity, hand washing is recommended. Avoid thermal shock (extreme temperature changes), don't use abrasive cleaners, and handle with care as handmade pieces can chip if dropped. Many Chicago potters use high-fire stoneware or porcelain which is very durable for daily use."
    },
    {
      question: "Can I request custom ceramic pieces?",
      answer: "Yes! Many Chicago ceramic artists accept custom orders. You can request specific colors, sizes, or designs. Contact the maker directly through their profile to discuss your custom project. Custom pottery typically takes 2-4 weeks as pieces must be thrown, dried, bisque fired, glazed, and glaze fired. Prices vary based on complexity and size."
    },
    {
      question: "Why are handmade ceramics more expensive than store-bought?",
      answer: "Handmade pottery reflects hours of skilled labor – from wedging clay and throwing on the wheel to trimming, glazing, and firing (often twice). Each piece is unique, not mass-produced. Chicago ceramic artists use high-quality materials and specialized equipment (kilns, wheels). You're paying for craftsmanship, artistry, and a one-of-a-kind piece that will last for generations. Plus, you're supporting a local Chicago maker's livelihood."
    },
    {
      question: "Where do Chicago potters work?",
      answer: "Many Chicago ceramic artists have studios in Pilsen, Logan Square, Wicker Park, and Ravenswood. Some share community studio spaces with kilns, while others have private studios. Several makers offer studio tours by appointment and participate in Chicago events like the Pilsen Open Studios and Logan Square Arts Festival. You can often meet the artist when you pick up your piece!"
    }
  ],

  jewelry: [
    {
      question: "What materials do Chicago jewelers use?",
      answer: "Chicago jewelry makers work with sterling silver, 14k and 18k gold (yellow, white, and rose), brass, copper, bronze, and mixed metals. Many incorporate gemstones (both precious and semi-precious), pearls, enamel, resin, wood, and recycled materials. Some specialize in specific materials like hand-forged silver, wire-wrapped gemstones, or laser-cut acrylic. Most makers clearly list materials in product descriptions and can provide metal purity certifications."
    },
    {
      question: "Can I get custom engagement rings from Chicago makers?",
      answer: "Absolutely! Many Chicago jewelers specialize in custom engagement rings and wedding bands. The process typically involves a consultation (in-person or virtual) to discuss your vision, style, budget, and stone preferences. The maker will create sketches or CAD designs for your approval, then handcraft your ring. Custom engagement rings typically take 3-6 weeks and start around $800-$1,200 for simple designs, up to $5,000+ for complex pieces with larger stones."
    },
    {
      question: "How do I know if jewelry is hypoallergenic?",
      answer: "Look for pieces made with hypoallergenic metals like sterling silver (.925), solid gold (14k or higher), platinum, titanium, or surgical-grade stainless steel. Avoid jewelry plated with nickel or made with mystery metals. Most Chicago makers clearly label hypoallergenic options and can answer questions about metal content. If you have metal allergies, message the maker before purchasing."
    },
    {
      question: "What jewelry styles are popular with Chicago makers?",
      answer: "Chicago's jewelry scene is diverse! Popular styles include minimalist geometric designs, nature-inspired pieces, bold statement jewelry, vintage-inspired Art Deco and Victorian styles, modern industrial aesthetic, culturally-influenced designs (Mexican, Polish, African heritage), and sustainable jewelry using recycled metals and ethically-sourced stones. You'll find everything from delicate everyday pieces ($25-$75) to investment statement pieces ($200-$1,000+)."
    },
    {
      question: "Do Chicago jewelers offer repair services?",
      answer: "Many do! Chicago jewelry makers often provide repair and restoration services for pieces purchased through our platform. Services can include resizing rings, replacing clasps, restringing pearls or beads, repairing broken chains, and re-tipping prongs on stone settings. Contact the maker directly to inquire about repairs. Some makers also repair jewelry purchased elsewhere."
    }
  ],

  "home-decor": [
    {
      question: "What home decor items are most popular from Chicago makers?",
      answer: "Top sellers include hand-poured candles ($15-$35), macramé wall hangings ($40-$120), handwoven throw blankets ($80-$200), ceramic planters and vases ($20-$75), reclaimed wood shelves and furniture ($100-$500), hand-printed tea towels and pillows ($18-$45), and Chicago-themed art prints ($25-$60). Seasonal items like holiday decorations are also very popular."
    },
    {
      question: "Can Chicago makers create custom furniture?",
      answer: "Yes! Several Chicago woodworkers and furniture makers accept custom commissions for tables, shelves, headboards, benches, and more. Custom furniture allows you to choose wood species, stain color, dimensions, and design details. Expect custom furniture to take 4-8 weeks depending on complexity. Prices vary widely based on materials and size – a custom dining table might range from $800-$3,000+."
    },
    {
      question: "Are handmade candles better than store-bought?",
      answer: "Handmade candles from Chicago makers typically use natural waxes (soy, coconut, beeswax) that burn cleaner and longer than paraffin wax candles. They use phthalate-free fragrances and essential oils, cotton or wood wicks, and are poured in small batches for quality control. You're also supporting local makers and getting unique scent combinations you won't find in chain stores. Plus, many makers use recyclable containers and offer refills to reduce waste."
    },
    {
      question: "How can I incorporate Chicago-made decor into my space?",
      answer: "Start with a few key pieces that reflect your style – maybe a handwoven throw blanket for texture, a ceramic planter with a local plant, or Chicago skyline art. Mix handmade items with your existing decor for an eclectic, personalized look. Many Chicago makers create pieces that complement both modern and traditional interiors. Consider themes like industrial-chic (reclaimed wood, metal accents), boho-natural (macramé, ceramics, plants), or minimal-Scandinavian (clean lines, neutral tones)."
    }
  ],

  art: [
    {
      question: "What's the difference between original art and prints?",
      answer: "Original art is a one-of-a-kind piece created by the artist (painting, drawing, original photograph print). Prints are reproductions of original artwork, typically giclee prints or screen prints, available in limited or open editions. Originals are priced higher ($200-$5,000+) due to their uniqueness. Prints are more affordable ($25-$150) and let you own artwork by Chicago artists at accessible prices. Both support local artists!"
    },
    {
      question: "Can I commission custom artwork from Chicago artists?",
      answer: "Many Chicago artists accept commissions! Custom art can include portraits (people or pets), Chicago neighborhood scenes, abstract pieces in your color palette, murals, or personalized illustrations. The process typically involves discussing your vision, reviewing sketches or mockups, and agreeing on size, medium, and price. Custom art takes 2-8 weeks depending on complexity and ranges from $200 (small illustrations) to $2,000+ (large paintings)."
    },
    {
      question: "How do I choose art for my space?",
      answer: "Start by considering your space's color palette, style, and what emotions you want to evoke. Measure your wall space – art should be proportional to the wall (general rule: art should be 2/3 to 3/4 the width of furniture below it). Don't be afraid to mix styles and sizes for a gallery wall. Most importantly, choose art that speaks to you! Chicago artists create diverse styles, so explore until you find pieces you love. Many makers offer same-day pickup so you can see the piece in your space right away."
    },
    {
      question: "What Chicago themes are popular in local art?",
      answer: "Chicago artists frequently depict the iconic skyline, Lake Michigan shoreline, architectural details (especially our bridges and 'L' trains), neighborhood street scenes (Pilsen murals, Wicker Park vintage shops), Chicago Flag imagery, seasons (especially dramatic winters), urban nature (gardens, parks, birds), and abstract pieces inspired by the city's energy. You'll also find art celebrating Chicago's cultural diversity and rich history."
    }
  ]
};

// Get category intro and FAQs by category slug
export function getCategoryContent(categorySlug: string): {
  intro: { title: string; description: string } | null;
  faqs: FAQItem[];
} {
  const normalizedSlug = categorySlug?.toLowerCase().trim();

  return {
    intro: categoryIntros[normalizedSlug] || null,
    faqs: categoryFAQs[normalizedSlug] || []
  };
}
