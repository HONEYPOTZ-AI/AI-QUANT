import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Eye, Tag, Share2, ArrowLeft, Facebook, Twitter, Linkedin, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publish_date: string;
  category: string;
  tags: string;
  meta_description: string;
  meta_keywords: string;
  featured_image: string;
  view_count: number;
}

const BlogArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      
      // Fetch the article by slug
      const { data, error } = await window.ezsite.apis.tablePage(74766, {
        PageNo: 1,
        PageSize: 1,
        Filters: [
          { name: 'slug', op: 'Equal', value: slug },
          { name: 'is_published', op: 'Equal', value: true }
        ]
      });

      if (error) throw error;

      if (!data?.List || data.List.length === 0) {
        navigate('/blog');
        toast({
          title: 'Article not found',
          description: 'The article you are looking for does not exist.',
          variant: 'destructive'
        });
        return;
      }

      const articleData = data.List[0];
      setArticle(articleData);

      // Increment view count
      await window.ezsite.apis.tableUpdate(74766, {
        id: articleData.id,
        view_count: articleData.view_count + 1
      });

      // Fetch related articles
      fetchRelatedArticles(articleData.category, articleData.id);
    } catch (error) {
      console.error('Error fetching article:', error);
      toast({
        title: 'Error',
        description: 'Failed to load article',
        variant: 'destructive'
      });
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedArticles = async (category: string, currentId: number) => {
    try {
      const { data, error } = await window.ezsite.apis.tablePage(74766, {
        PageNo: 1,
        PageSize: 4,
        OrderByField: 'publish_date',
        IsAsc: false,
        Filters: [
          { name: 'category', op: 'Equal', value: category },
          { name: 'is_published', op: 'Equal', value: true }
        ]
      });

      if (error) throw error;
      
      const related = (data?.List || []).filter((a: Article) => a.id !== currentId).slice(0, 3);
      setRelatedArticles(related);
    } catch (error) {
      console.error('Error fetching related articles:', error);
    }
  };

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const title = article?.title || '';

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast({ title: 'Link copied!', description: 'Article link copied to clipboard' });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast({ title: 'Failed to copy', variant: 'destructive' });
      }
    } else {
      // Try native share API
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
        } catch (err) {
          console.log('Share cancelled');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading article...</div>
      </div>
    );
  }

  if (!article) return null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.meta_description || article.excerpt,
    "image": article.featured_image,
    "datePublished": article.publish_date,
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "AI QUANT",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    }
  };

  return (
    <>
      <Helmet>
        <title>{article.title} - AI QUANT Blog</title>
        <meta name="description" content={article.meta_description || article.excerpt} />
        <meta name="keywords" content={article.meta_keywords} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.meta_description || article.excerpt} />
        <meta property="og:image" content={article.featured_image} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.meta_description || article.excerpt} />
        <meta name="twitter:image" content={article.featured_image} />
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-slate-900 pt-16">
        <article className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-slate-300">{article.title}</span>
          </nav>

          <Link to="/blog" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>

          {/* Featured Image */}
          {article.featured_image && (
            <div className="w-full h-64 sm:h-96 rounded-lg overflow-hidden mb-8">
              <img 
                src={article.featured_image} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <header className="mb-8">
            {article.category && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 mb-4">
                {article.category}
              </Badge>
            )}
            
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm mb-6">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {article.author}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(article.publish_date), 'MMMM dd, yyyy')}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {article.view_count} views
              </span>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2 py-4">
              <span className="text-slate-400 text-sm mr-2">Share:</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare('twitter')}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare('facebook')}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare('linkedin')}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare('copy')}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <Separator className="bg-slate-700" />
          </header>

          {/* Article Content */}
          <section className="prose prose-invert prose-slate max-w-none mb-12">
            <div 
              className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </section>

          {/* Tags */}
          {article.tags && (
            <div className="mb-12">
              <Separator className="bg-slate-700 mb-6" />
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                {article.tags.split(',').map((tag, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.map((related) => (
                  <Link key={related.id} to={`/blog/${related.slug}`}>
                    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all h-full group">
                      {related.featured_image && (
                        <div className="w-full h-40 overflow-hidden rounded-t-lg">
                          <img 
                            src={related.featured_image} 
                            alt={related.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          {related.category && (
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-xs">
                              {related.category}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-white text-lg font-semibold group-hover:text-blue-400 transition-colors line-clamp-2">
                          {related.title}
                        </h3>
                        <p className="text-slate-400 text-sm line-clamp-2 mt-2">
                          {related.excerpt}
                        </p>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </>
  );
};

export default BlogArticlePage;