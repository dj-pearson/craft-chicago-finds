import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface AISearchOptimizationProps {
  content: {
    directAnswer?: string;
    keyFacts?: string[];
    faqs?: Array<{
      question: string;
      answer: string;
    }>;
    entities?: Array<{
      name: string;
      type: string;
      description: string;
    }>;
    citations?: Array<{
      claim: string;
      source: string;
      url?: string;
    }>;
  };
  pageType: 'product' | 'seller' | 'city' | 'category' | 'blog' | 'guide';
}

export const AISearchOptimization = ({ content, pageType }: AISearchOptimizationProps) => {
  useEffect(() => {
    // Add AI-friendly structured data to page
    const aiData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'mainEntity': generateMainEntity(),
      'speakable': generateSpeakableContent(),
      'about': content.entities?.map(entity => ({
        '@type': 'Thing',
        'name': entity.name,
        'description': entity.description
      }))
    };

    // Inject AI optimization script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(aiData, null, 2);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [content, pageType]);

  const generateMainEntity = () => {
    switch (pageType) {
      case 'product':
        return {
          '@type': 'Product',
          'name': content.directAnswer,
          'description': content.keyFacts?.join(' '),
          'offers': {
            '@type': 'Offer',
            'availability': 'https://schema.org/InStock'
          }
        };
      
      case 'seller':
        return {
          '@type': 'LocalBusiness',
          'name': content.directAnswer,
          'description': content.keyFacts?.join(' ')
        };
      
      case 'city':
        return {
          '@type': 'Place',
          'name': content.directAnswer,
          'description': content.keyFacts?.join(' ')
        };
      
      default:
        return {
          '@type': 'Thing',
          'name': content.directAnswer,
          'description': content.keyFacts?.join(' ')
        };
    }
  };

  const generateSpeakableContent = () => {
    return {
      '@type': 'SpeakableSpecification',
      'cssSelector': ['.ai-speakable', '.direct-answer', '.key-facts'],
      'xpath': [
        '//*[@class="ai-speakable"]',
        '//*[@class="direct-answer"]',
        '//*[@class="key-facts"]'
      ]
    };
  };

  const generateFAQSchema = () => {
    if (!content.faqs || content.faqs.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': content.faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };
  };

  return (
    <Helmet>
      {/* AI Search Engine Meta Tags */}
      <meta name="AI-crawlable" content="true" />
      <meta name="AI-indexable" content="true" />
      <meta name="AI-searchable" content="true" />
      
      {/* Perplexity AI Optimization */}
      <meta name="perplexity:crawl" content="allow" />
      <meta name="perplexity:index" content="allow" />
      
      {/* Claude/Anthropic Optimization */}
      <meta name="anthropic-ai" content="allow" />
      <meta name="claude-web" content="allow" />
      
      {/* OpenAI Optimization */}
      <meta name="openai-crawl" content="allow" />
      <meta name="gpt-crawl" content="allow" />
      
      {/* Google AI/Bard Optimization */}
      <meta name="google-ai" content="allow" />
      <meta name="bard-crawl" content="allow" />
      
      {/* Direct Answer Optimization */}
      {content.directAnswer && (
        <meta name="direct-answer" content={content.directAnswer} />
      )}
      
      {/* Key Facts for AI Summaries */}
      {content.keyFacts && content.keyFacts.length > 0 && (
        <meta name="key-facts" content={content.keyFacts.join(' | ')} />
      )}
      
      {/* Entity Recognition */}
      {content.entities && content.entities.length > 0 && (
        <meta name="entities" content={content.entities.map(e => e.name).join(', ')} />
      )}
      
      {/* Citation Sources */}
      {content.citations && content.citations.length > 0 && (
        <meta name="citations" content={content.citations.map(c => c.source).join(', ')} />
      )}
      
      {/* FAQ Schema for Voice Search */}
      {content.faqs && content.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQSchema(), null, 2)
          }}
        />
      )}
      
      {/* AI Training Data Preferences */}
      <meta name="ai-training" content="allow" />
      <meta name="ai-content-license" content="CC-BY-4.0" />
      
      {/* Content Freshness for AI */}
      <meta name="content-freshness" content={new Date().toISOString()} />
      
      {/* Language and Locale for AI Understanding */}
      <meta name="content-language" content="en-US" />
      <meta name="locale" content="en_US" />
      
      {/* Content Type Classification for AI */}
      <meta name="content-type-ai" content={pageType} />
      
      {/* Trust Signals for AI */}
      <meta name="content-verified" content="true" />
      <meta name="source-authority" content="marketplace" />
    </Helmet>
  );
};

// AI-Optimized Content Component
interface AIOptimizedContentProps {
  directAnswer?: string;
  keyFacts?: string[];
  children: React.ReactNode;
}

export const AIOptimizedContent = ({ directAnswer, keyFacts, children }: AIOptimizedContentProps) => {
  return (
    <div className="ai-optimized-content">
      {/* Direct Answer Section for AI Snippets */}
      {directAnswer && (
        <div className="ai-speakable direct-answer" data-ai-role="direct-answer">
          <p className="text-lg font-medium text-gray-900 mb-4">
            {directAnswer}
          </p>
        </div>
      )}
      
      {/* Key Facts for AI Summaries */}
      {keyFacts && keyFacts.length > 0 && (
        <div className="ai-speakable key-facts mb-6" data-ai-role="key-facts">
          <ul className="space-y-2">
            {keyFacts.map((fact, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Main Content */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

// FAQ Component for Voice Search Optimization
interface AIFAQProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export const AIFAQ = ({ faqs }: AIFAQProps) => {
  return (
    <div className="ai-faq-section" data-ai-role="faq">
      <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b pb-4" itemScope itemType="https://schema.org/Question">
            <h3 className="font-semibold mb-2 ai-speakable" itemProp="name">
              {faq.question}
            </h3>
            <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
              <p className="text-gray-700 ai-speakable" itemProp="text">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
