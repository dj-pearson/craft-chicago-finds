import { useEffect, useState } from 'react';
import { SEOHead } from './SEOHead';
import { generateCityPageSEO, generateSellerProfileSEO, generateListingSEO } from '@/lib/seo-utils';
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

    let config: any;
    
    switch (pageType) {
      case 'city':
        config = generateCityPageSEO({
          cityName: currentCity.name,
          stateCode: currentCity.state,
          description: currentCity.description || `Discover handmade goods in ${currentCity.name}`,
          listingCount: 0,
          topCategories: [],
          featuredMakers: []
        });
        break;
        
      case 'seller':
        config = generateSellerProfileSEO({
          name: pageData?.name || pageData?.shop_name || 'Local Seller',
          bio: pageData?.bio || 'Handmade artisan at CraftLocal',
          location: currentCity.name,
          specialties: pageData?.specialties || pageData?.tags || ['Handmade'],
          itemCount: pageData?.itemCount || 0,
          rating: pageData?.rating || undefined,
        });
        break;
        
      case 'product':
        config = generateListingSEO({
          title: pageData?.product?.title || 'Handmade Product',
          description: pageData?.product?.description || '',
          keywords: pageData?.product?.tags || [],
          slug: pageData?.product?.slug || '',
          images: pageData?.product?.images || [],
          price: pageData?.product?.price || 0,
          seller: { name: pageData?.seller?.shop_name || pageData?.seller?.name || 'Seller', location: currentCity.name },
          category: pageData?.product?.category || 'Handmade',
          tags: pageData?.product?.tags || [],
        });
        break;
        
      case 'category':
        config = generateCategorySEO(pageData, currentCity);
        break;
        
      default:
        config = generateCityPageSEO({
          cityName: currentCity.name,
          stateCode: currentCity.state,
          description: currentCity.description || `Discover handmade goods in ${currentCity.name}`,
          listingCount: 0,
          topCategories: [],
          featuredMakers: []
        });
    }

    // Add additional schema if provided
    if (additionalSchema.length > 0) {
      config.schema = [...(config.schema || []), ...additionalSchema];
    }

    setSeoConfig(config);

    // Track page views with Google Analytics - lazy load to avoid circular deps
    const trackAnalytics = async () => {
      try {
        const { trackPageView, trackCityVisit, trackCategoryView, trackSellerView, trackViewItem } = await import('@/lib/analytics');
        
        const currentUrl = window.location.href;
        trackPageView(currentUrl, config.title);

        // Track specific page types
        switch (pageType) {
          case 'city':
            trackCityVisit({
              city_slug: currentCity.slug,
              city_name: currentCity.name,
              state: currentCity.state
            });
            break;
          
          case 'seller':
            trackSellerView({
              seller_id: pageData.id,
              shop_name: pageData.shop_name || pageData.name,
              city: currentCity.name,
              category: pageData.specialties?.[0] || 'General'
            });
            break;
          
          case 'product':
            trackViewItem({
              item_id: pageData.product.id,
              item_name: pageData.product.title,
              category: pageData.product.category || 'Handmade',
              price: pageData.product.price,
              currency: 'USD',
              item_brand: pageData.seller.shop_name || pageData.seller.name
            });
            break;
          
          case 'category':
            trackCategoryView({
              category: pageData.name,
              city: currentCity.name,
              results_count: pageData.productCount
            });
            break;
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
      }
    };

    trackAnalytics();
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
      canonical: `https://craftlocal.net/cities/${city.slug}/categories/${categoryData.slug}`,
      openGraph: {
        title: `Handmade ${categoryName} in ${cityName}`,
        description: `Discover unique handmade ${categoryName.toLowerCase()} from talented local artisans in ${cityName}, ${stateName}.`,
        image: `https://craftlocal.net/images/categories/${categoryData.slug}-${city.slug}.jpg`,
        type: "website"
      },
      schema: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `Handmade ${categoryName} in ${cityName}`,
          "description": `Collection of handmade ${categoryName.toLowerCase()} from local artisans in ${cityName}, ${stateName}`,
          "url": `https://craftlocal.net/cities/${city.slug}/categories/${categoryData.slug}`,
          "mainEntity": {
            "@type": "ItemList",
            "name": `${categoryName} Products`,
            "numberOfItems": categoryData.productCount || 0
          },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://craftlocal.net" },
              { "@type": "ListItem", "position": 2, "name": cityName, "item": `https://craftlocal.net/cities/${city.slug}` },
              { "@type": "ListItem", "position": 3, "name": categoryName, "item": `https://craftlocal.net/cities/${city.slug}/categories/${categoryData.slug}` }
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
      {/* City-specific meta tags - simplified since geo properties not available */}
      {currentCity && (
        <>
          <meta name="geo.region" content={`US-${currentCity.state}`} />
          <meta name="geo.placename" content={`${currentCity.name}, ${currentCity.state}`} />
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
