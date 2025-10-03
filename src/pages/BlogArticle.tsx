import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/seo/SEOHead";

export default function BlogArticle() {
  const { citySlug, slug } = useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ["blog-article", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_articles")
        .select("*, cities(id, name, slug)")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      return data;
    },
  });

  useEffect(() => {
    if (article?.id) {
      supabase.rpc("increment_blog_view_count", { article_slug: slug });
    }
  }, [article?.id, slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
        <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist or hasn't been published yet.</p>
        <Link to="/blog">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        config={{
          title: article.meta_title || article.title,
          description: article.meta_description,
          keywords: article.keywords,
          openGraph: {
            image: article.featured_image || undefined,
          },
        }}
      />

      <article className="container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/blog">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge variant="secondary">{article.category}</Badge>
            {(article.cities as any)?.name && (
              <Badge variant="outline">{(article.cities as any).name}</Badge>
            )}
            {article.ai_generated && (
              <Badge variant="outline">AI Generated</Badge>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">{article.title}</h1>
          
          <p className="text-xl text-muted-foreground mb-6">{article.excerpt}</p>

          <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(article.publish_date || article.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {article.estimated_reading_time} min read
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {article.view_count.toLocaleString()} views
            </div>
          </div>
        </header>

        {article.featured_image && (
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-96 object-cover rounded-lg mb-8"
          />
        )}

        <div 
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-sm font-semibold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t">
          <Link to="/blog">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </article>
    </>
  );
}
