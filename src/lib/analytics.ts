// Google Analytics 4 utility functions
import { GA_MEASUREMENT_ID } from './analytics-constants';

// Re-export for backwards compatibility
export { GA_MEASUREMENT_ID };

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: url,
      page_title: title,
    });
  }
};

// Track custom events
export const trackEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: parameters.category || 'engagement',
      event_label: parameters.label,
      value: parameters.value,
      ...parameters,
    });
  }
};

// E-commerce tracking events
export const trackPurchase = (transactionData: {
  transaction_id: string;
  value: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity: number;
    price: number;
    item_brand?: string;
  }>;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionData.transaction_id,
      value: transactionData.value,
      currency: transactionData.currency,
      items: transactionData.items,
    });
  }
};

export const trackAddToCart = (item: {
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  price: number;
  currency: string;
  item_brand?: string;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: item.currency,
      value: item.price * item.quantity,
      items: [item],
    });
  }
};

export const trackRemoveFromCart = (item: {
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  price: number;
  currency: string;
  item_brand?: string;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'remove_from_cart', {
      currency: item.currency,
      value: item.price * item.quantity,
      items: [item],
    });
  }
};

export const trackViewItem = (item: {
  item_id: string;
  item_name: string;
  category: string;
  price: number;
  currency: string;
  item_brand?: string;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: item.currency,
      value: item.price,
      items: [item],
    });
  }
};

export const trackSearch = (searchTerm: string, results?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'search', {
      search_term: searchTerm,
      ...(results !== undefined && { search_results: results }),
    });
  }
};

export const trackSignUp = (method?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method || 'email',
    });
  }
};

export const trackLogin = (method?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'login', {
      method: method || 'email',
    });
  }
};

// Custom marketplace events
export const trackSellerSignup = (sellerData: {
  seller_id: string;
  city: string;
  category: string;
}) => {
  trackEvent('seller_signup', {
    category: 'seller_engagement',
    seller_id: sellerData.seller_id,
    city: sellerData.city,
    seller_category: sellerData.category,
  });
};

export const trackListingCreated = (listingData: {
  listing_id: string;
  seller_id: string;
  category: string;
  price: number;
  city: string;
}) => {
  trackEvent('listing_created', {
    category: 'seller_engagement',
    listing_id: listingData.listing_id,
    seller_id: listingData.seller_id,
    listing_category: listingData.category,
    listing_price: listingData.price,
    city: listingData.city,
  });
};

export const trackCityVisit = (cityData: {
  city_slug: string;
  city_name: string;
  state: string;
}) => {
  trackEvent('city_visit', {
    category: 'navigation',
    city_slug: cityData.city_slug,
    city_name: cityData.city_name,
    state: cityData.state,
  });
};

export const trackCategoryView = (categoryData: {
  category: string;
  city?: string;
  results_count?: number;
}) => {
  trackEvent('category_view', {
    category: 'navigation',
    viewed_category: categoryData.category,
    city: categoryData.city,
    results_count: categoryData.results_count,
  });
};

export const trackSellerView = (sellerData: {
  seller_id: string;
  shop_name: string;
  city: string;
  category: string;
}) => {
  trackEvent('seller_view', {
    category: 'engagement',
    seller_id: sellerData.seller_id,
    shop_name: sellerData.shop_name,
    city: sellerData.city,
    seller_category: sellerData.category,
  });
};

export const trackWishlistAdd = (item: {
  item_id: string;
  item_name: string;
  category: string;
  price: number;
  seller_id: string;
}) => {
  trackEvent('add_to_wishlist', {
    category: 'engagement',
    item_id: item.item_id,
    item_name: item.item_name,
    item_category: item.category,
    item_price: item.price,
    seller_id: item.seller_id,
  });
};

export const trackShare = (contentType: string, contentId: string, method: string) => {
  trackEvent('share', {
    category: 'engagement',
    content_type: contentType,
    content_id: contentId,
    method: method,
  });
};

export const trackNewsletterSignup = (source: string) => {
  trackEvent('newsletter_signup', {
    category: 'conversion',
    source: source,
  });
};

export const trackContactForm = (formType: string) => {
  trackEvent('contact_form_submit', {
    category: 'conversion',
    form_type: formType,
  });
};

// Enhanced e-commerce events for marketplace
export const trackBeginCheckout = (items: Array<{
  item_id: string;
  item_name: string;
  category: string;
  quantity: number;
  price: number;
  item_brand?: string;
}>, value: number, currency: string = 'USD') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: currency,
      value: value,
      items: items,
    });
  }
};

export const trackAddPaymentInfo = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_payment_info');
  }
};

export const trackAddShippingInfo = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_shipping_info');
  }
};

// Blog and content tracking
export const trackBlogView = (postData: {
  post_id: string;
  post_title: string;
  category: string;
  author: string;
  city?: string;
}) => {
  trackEvent('blog_view', {
    category: 'content',
    post_id: postData.post_id,
    post_title: postData.post_title,
    post_category: postData.category,
    author: postData.author,
    city: postData.city,
  });
};

export const trackGuideView = (guideData: {
  guide_id: string;
  guide_title: string;
  category: string;
}) => {
  trackEvent('guide_view', {
    category: 'content',
    guide_id: guideData.guide_id,
    guide_title: guideData.guide_title,
    guide_category: guideData.category,
  });
};

// User engagement metrics
export const trackScrollDepth = (depth: number) => {
  trackEvent('scroll_depth', {
    category: 'engagement',
    scroll_depth: depth,
  });
};

export const trackTimeOnPage = (seconds: number) => {
  trackEvent('time_on_page', {
    category: 'engagement',
    time_seconds: seconds,
  });
};

// Conversion funnel tracking
export const trackFunnelStep = (stepName: string, stepNumber: number, additionalData?: Record<string, any>) => {
  trackEvent('funnel_step', {
    category: 'conversion_funnel',
    step_name: stepName,
    step_number: stepNumber,
    ...additionalData,
  });
};
