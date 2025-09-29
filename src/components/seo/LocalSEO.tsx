import { useEffect, useState } from 'react';
import { SEOHead } from './SEOHead';
import { seoManager, LocalSEOData } from '@/lib/seo-utils';
import { useCityContext } from '@/hooks/useCityContext';

interface LocalSEOProps {
  pageType?: 'city' | 'seller' | 'product' | 'category';
  pageData?: any;
  additionalSchema?: any[];
}

export const LocalSEO = ({ pageType = 'city', pageData, additionalSchema = [] }: LocalSEOProps) => {
  const { currentCity } = useCityContext();
  const [seoConfig, setSeoConfig] = useState(null);

  useEffect(() => {
    if (!currentCity) return;

    let config;
    
    switch (pageType) {
      case 'city':
        config = seoManager.generateCitySEO(currentCity);
        break;
        
      case 'seller':
        config = seoManager.generateSellerSEO(pageData, currentCity);
        break;
        
      case 'product':
        config = seoManager.generateProductSEO(pageData.product, pageData.seller, currentCity);
        break;
        
      case 'category':
        config = generateCategorySEO(pageData, currentCity);
        break;
        
      default:
        config = seoManager.generateCitySEO(currentCity);
    }

    // Add additional schema if provided
    if (additionalSchema.length > 0) {
      config.schema = [...(config.schema || []), ...additionalSchema];
    }

    setSeoConfig(config);
  }, [currentCity, pageType, pageData, additionalSchema]);

  const generateCategorySEO = (categoryData: any, city: any) => {
    const categoryName = categoryData.name;
    const cityName = city.name;
    const stateName = city.state;
    
    return {
      title: `Handmade ${categoryName} in ${cityName}, ${stateName} | Local Artisans | CraftLocal`,
      description: `Shop unique handmade ${categoryName.toLowerCase()} from local artisans in ${cityName}, ${stateName}. Discover one-of-a-kind pieces crafted by talented makers in your community.`,
      keywords: [
        `handmade ${categoryName.toLowerCase()} ${cityName}`,
        `local ${categoryName.toLowerCase()} ${cityName}`,
        `${cityName} artisan ${categoryName.toLowerCase()}`,
        `handcrafted ${categoryName.toLowerCase()} ${stateName}`,
        `custom ${categoryName.toLowerCase()} ${cityName}`,
        `unique ${categoryName.toLowerCase()} local`,
        `${categoryName.toLowerCase()} makers ${cityName}`
      ],
      canonical: `https://craftlocal.com/cities/${city.slug}/categories/${categoryData.slug}`,
      openGraph: {
        title: `Handmade ${categoryName} in ${cityName}`,
        description: `Discover unique handmade ${categoryName.toLowerCase()} from talented local artisans in ${cityName}, ${stateName}.`,
        image: `https://craftlocal.com/images/categories/${categoryData.slug}-${city.slug}.jpg`,
        type: "website"
      },
      schema: [
        seoManager.generateSchema("BreadcrumbList", {
          breadcrumbs: [
            { name: "Home", url: "https://craftlocal.com" },
            { name: cityName, url: `https://craftlocal.com/cities/${city.slug}` },
            { name: categoryName, url: `https://craftlocal.com/cities/${city.slug}/categories/${categoryData.slug}` }
          ]
        }),
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `Handmade ${categoryName} in ${cityName}`,
          "description": `Collection of handmade ${categoryName.toLowerCase()} from local artisans in ${cityName}, ${stateName}`,
          "url": `https://craftlocal.com/cities/${city.slug}/categories/${categoryData.slug}`,
          "mainEntity": {
            "@type": "ItemList",
            "name": `${categoryName} Products`,
            "numberOfItems": categoryData.productCount || 0
          },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://craftlocal.com"
              },
              {
                "@type": "ListItem", 
                "position": 2,
                "name": cityName,
                "item": `https://craftlocal.com/cities/${city.slug}`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": categoryName,
                "item": `https://craftlocal.com/cities/${city.slug}/categories/${categoryData.slug}`
              }
            ]
          }
        }
      ]
    };
  };

  if (!seoConfig) {
    return null;
  }

  return (
    <SEOHead config={seoConfig}>
      {/* City-specific geo tags */}
      {currentCity && (
        <>
          <meta name="geo.region" content={`US-${currentCity.state_code}`} />
          <meta name="geo.placename" content={`${currentCity.name}, ${currentCity.state}`} />
          <meta name="geo.position" content={`${currentCity.latitude};${currentCity.longitude}`} />
          <meta name="ICBM" content={`${currentCity.latitude}, ${currentCity.longitude}`} />
        </>
      )}
      
      {/* Local Business Verification */}
      <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE" />
      <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />
      
      {/* Local Search Optimization */}
      <meta name="locality" content={currentCity?.name} />
      <meta name="region" content={currentCity?.state} />
      <meta name="country" content="United States" />
    </SEOHead>
  );
};
