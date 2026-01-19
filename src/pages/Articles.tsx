import { useState, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Book, Shield, Clock, ArrowRight, Search, Filter, ChevronDown, TrendingUp, Users, Flame, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { articlesMeta, getCategories, getFeaturedArticles } from '@/data/articlesData';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'intermediate':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'advanced':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    'OpSec': <Shield className="w-4 h-4" />,
    'Wallet Security': <Shield className="w-4 h-4" />,
    'Phishing': <Flame className="w-4 h-4" />,
    'DeFi': <TrendingUp className="w-4 h-4" />,
    'Smart Contracts': <Award className="w-4 h-4" />,
    'Scams': <Flame className="w-4 h-4" />,
  };
  return icons[category] || <Book className="w-4 h-4" />;
};

const Articles = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  
  const categories = getCategories();
  const featuredArticles = getFeaturedArticles();
  
  const filteredArticles = useMemo(() => {
    return articlesMeta.filter(article => {
      const matchesSearch = searchQuery === '' || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(article.category);
      
      const matchesDifficulty = selectedDifficulty.length === 0 || 
        selectedDifficulty.includes(article.difficulty);
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [searchQuery, selectedCategories, selectedDifficulty]);

  const nonFeaturedArticles = filteredArticles.filter(a => !a.featured);
  const displayedFeatured = filteredArticles.filter(a => a.featured);

  // Create FAQ structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": featuredArticles.slice(0, 5).map(article => ({
      "@type": "Question",
      "name": article.title,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": article.description
      }
    }))
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Web3 Security Guides & Articles — Crypto OpSec, Wallet Security, DeFi Safety | Digibastion"
        description={`${articlesMeta.length}+ expert guides on Web3 security: wallet protection, phishing prevention, DeFi safety, smart contract audits, and OpSec best practices. Free resources for crypto users, developers, and protocols.`}
        keywords="web3 security articles, crypto security guides, blockchain security tutorials, defi security tips, wallet security best practices, opsec for crypto, hardware wallet comparison, phishing prevention, smart contract security, rug pull detection"
      />
      
      {/* FAQ Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Book className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{articlesMeta.length}+ Security Guides</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Web3 Security Knowledge Base
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expert guides on wallet security, phishing prevention, DeFi safety, and operational security. 
              From beginner basics to advanced smart contract auditing.
            </p>
          </header>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Category
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {categories.map(category => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      setSelectedCategories(prev => 
                        checked ? [...prev, category] : prev.filter(c => c !== category)
                      );
                    }}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Users className="w-4 h-4" />
                  Level
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {['beginner', 'intermediate', 'advanced'].map(level => (
                  <DropdownMenuCheckboxItem
                    key={level}
                    checked={selectedDifficulty.includes(level)}
                    onCheckedChange={(checked) => {
                      setSelectedDifficulty(prev => 
                        checked ? [...prev, level] : prev.filter(l => l !== level)
                      );
                    }}
                  >
                    <span className="capitalize">{level}</span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Featured Articles */}
          {displayedFeatured.length > 0 && (
            <section aria-labelledby="featured-articles" className="mb-12">
              <h2 id="featured-articles" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-destructive" />
                Featured Guides
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {displayedFeatured.map((article) => (
                  <Link 
                    key={article.slug}
                    to={`/articles/${article.slug}`}
                    className="block group"
                  >
                    <article className="h-full bg-card rounded-xl p-6 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {getCategoryIcon(article.category)}
                          <span className="ml-1">{article.category}</span>
                        </Badge>
                        <Badge variant="outline" className={getDifficultyColor(article.difficulty)}>
                          {article.difficulty}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{article.readTime}</span>
                        </div>
                        <span className="text-primary text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                          Read guide <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All Articles Grid */}
          <section aria-labelledby="all-articles">
            <h2 id="all-articles" className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Book className="w-5 h-5 text-primary" />
              All Security Guides
              <span className="text-sm font-normal text-muted-foreground">({filteredArticles.length} articles)</span>
            </h2>
            
            {filteredArticles.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-foreground mb-2">No articles found</p>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nonFeaturedArticles.map((article) => (
                  <Link 
                    key={article.slug}
                    to={`/articles/${article.slug}`}
                    className="block group"
                  >
                    <article className="h-full bg-card rounded-lg p-5 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {article.category}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getDifficultyColor(article.difficulty)}`}>
                          {article.difficulty}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 text-sm">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.readTime}
                        </div>
                        <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Read →
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* SEO Content */}
          <section className="mt-16 prose prose-invert max-w-none">
            <div className="bg-card/50 rounded-xl p-8 border border-border/50">
              <h2 className="text-2xl font-bold text-foreground mb-4">Learn Web3 Security from the Experts</h2>
              <p className="text-muted-foreground mb-4">
                Digibastion's security knowledge base provides comprehensive guides for protecting your cryptocurrency 
                and digital assets. Whether you're new to crypto or an experienced DeFi user, our articles cover 
                essential topics from hardware wallet setup to advanced smart contract security.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">For Beginners</h3>
                  <p className="text-sm text-muted-foreground">
                    Start with wallet security basics, learn to spot phishing attacks, and understand how to safely 
                    interact with DeFi protocols.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">For DeFi Users</h3>
                  <p className="text-sm text-muted-foreground">
                    Deep dives into DeFi risks, flash loan attacks, impermanent loss, and how to evaluate protocol 
                    security before depositing funds.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">For Developers</h3>
                  <p className="text-sm text-muted-foreground">
                    Solidity security best practices, smart contract auditing techniques, and formal verification 
                    methods for building secure protocols.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Articles;
