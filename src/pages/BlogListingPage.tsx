import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, User, Tag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  publish_date: string;
  category: string;
  tags: string;
  featured_image: string;
  view_count: number;
}

const BlogListingPage = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 9;

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await window.ezsite.apis.tablePage(74766, {
        PageNo: 1,
        PageSize: 1000,
        OrderByField: 'publish_date',
        IsAsc: false,
        Filters: [
          {
            name: 'is_published',
            op: 'Equal',
            value: true
          }
        ]
      });

      if (error) throw error;
      setArticles(data?.List || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load articles',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(articles.map(a => a.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [articles, searchQuery, selectedCategory]);

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    return filteredArticles.slice(startIndex, startIndex + articlesPerPage);
  }, [filteredArticles, currentPage]);

  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading articles...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Blog - AI QUANT | Financial Intelligence & Trading Insights</title>
        <meta name="description" content="Explore expert insights on AI-powered trading, quantitative finance, SPX options strategies, and market analytics from the AI QUANT team." />
        <meta name="keywords" content="AI trading, quantitative finance, SPX options, market analytics, trading strategies, financial intelligence" />
        <meta property="og:title" content="Blog - AI QUANT" />
        <meta property="og:description" content="Expert insights on AI-powered trading and quantitative finance" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-slate-900 pt-16">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-lg">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              AI QUANT <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Blog</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl">
              Expert insights on AI-powered trading, quantitative finance, and market analytics
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-12">
          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                  }}
                  className={selectedCategory === category 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  }
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="mb-6 text-slate-400">
            Showing {paginatedArticles.length} of {filteredArticles.length} articles
          </div>

          {/* Articles Grid */}
          {paginatedArticles.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <p className="text-slate-400 text-lg">No articles found. Try adjusting your search or filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {paginatedArticles.map((article) => (
                <Link key={article.id} to={`/blog/${article.slug}`}>
                  <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all h-full flex flex-col overflow-hidden group">
                    {article.featured_image && (
                      <div className="w-full h-48 overflow-hidden">
                        <img 
                          src={article.featured_image} 
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {article.category && (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-xs">
                            {article.category}
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(article.publish_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <CardTitle className="text-white text-xl mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="text-slate-400 line-clamp-3">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-slate-700">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {article.author}
                        </span>
                        <span>{article.view_count} views</span>
                      </div>
                      {article.tags && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {article.tags.split(',').slice(0, 3).map((tag, index) => (
                            <span key={index} className="text-xs text-slate-500 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                      : 'border-slate-600 text-slate-300 hover:bg-slate-800'
                    }
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlogListingPage;