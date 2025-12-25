import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Helmet } from "react-helmet-async";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * SEO-optimized Breadcrumb component with BreadcrumbList schema markup.
 * Helps search engines understand site hierarchy and enables breadcrumb rich results in SERPs.
 *
 * Usage:
 * <Breadcrumbs items={[
 *   { label: "Home", href: "/" },
 *   { label: "Chicago", href: "/chicago" },
 *   { label: "Browse", href: "/chicago/browse" },
 *   { label: "Product Name" } // Last item has no href (current page)
 * ]} />
 */
export const Breadcrumbs = ({ items, className = "" }: BreadcrumbsProps) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://craftchicagofinds.com';

  // Generate BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      ...(item.href && { "item": `${baseUrl}${item.href}` })
    }))
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>

      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-1 text-sm text-muted-foreground ${className}`}
      >
        <ol className="flex items-center gap-1 flex-wrap" itemScope itemType="https://schema.org/BreadcrumbList">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isFirst = index === 0;

            return (
              <li
                key={index}
                className="flex items-center gap-1"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                )}

                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                    itemProp="item"
                  >
                    {isFirst && <Home className="h-4 w-4" aria-hidden="true" />}
                    <span itemProp="name">{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={isLast ? "text-foreground font-medium" : ""}
                    itemProp="name"
                    aria-current={isLast ? "page" : undefined}
                  >
                    {isFirst && !item.href && <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                    {item.label}
                  </span>
                )}

                <meta itemProp="position" content={String(index + 1)} />
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
