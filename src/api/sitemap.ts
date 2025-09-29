import { seoManager } from '@/lib/seo-utils';

// Dynamic sitemap generation API routes
// These would be implemented as Supabase Edge Functions or Next.js API routes

export const generateSitemap = async (type: 'index' | 'static' | 'products' | 'sellers' | 'cities' | 'blog') => {
  const domain = 'https://craftlocal.com';
  
  try {
    switch (type) {
      case 'index':
        return seoManager.generateSitemapIndex(domain);
      
      case 'static':
      case 'products':
      case 'sellers':
      case 'cities':
      case 'blog':
        const entries = await seoManager.generateSitemapEntries(type);
        return seoManager.generateSitemapXML(entries);
      
      default:
        throw new Error(`Unknown sitemap type: ${type}`);
    }
  } catch (error) {
    console.error(`Error generating ${type} sitemap:`, error);
    throw error;
  }
};

export const generateRobotsTxt = () => {
  return seoManager.generateRobotsTxt('https://craftlocal.com');
};

export const generateLLMsTxt = () => {
  return seoManager.generateLLMsTxt();
};
