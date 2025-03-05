
import { useState, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Search, Tag, ExternalLink, Filter, Github } from 'lucide-react';
// Update import path to use the new structure
import { securityResources, getAllTags } from '../data/links';
import { MetaTags } from '../components/MetaTags';

const Links = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const allTags = useMemo(() => getAllTags(), []);
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const filteredResources = useMemo(() => {
    return securityResources.categories
      .filter(category => 
        selectedCategory === 'all' || category.name === selectedCategory
      )
      .map(category => ({
        ...category,
        tools: category.tools.filter(tool => {
          const matchesSearch = 
            tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchQuery.toLowerCase());
          
          const matchesTags = 
            selectedTags.length === 0 || 
            tool.tags.some(tag => selectedTags.includes(tag));
          
          return matchesSearch && matchesTags && tool.active;
        })
      }))
      .filter(category => category.tools.length > 0);
  }, [searchQuery, selectedCategory, selectedTags]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Security Resources & Links | Digibastion"
        description="Access our curated collection of Web3 security resources, tools, and educational materials. Find everything you need to enhance your blockchain security."
        type="website"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">Security Resources</h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-6">
              A curated collection of security tools, guides, and resources for Web3 developers and users.
            </p>
            <Button
              variant="outline"
              className="hover:bg-primary hover:text-white transition-all duration-300"
              onClick={() => window.open('https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md', '_blank')}
            >
              <Github className="w-4 h-4 mr-2" />
              Contribute on GitHub
            </Button>
          </div>

          <div className="mb-8 space-y-4 bg-secondary/50 backdrop-blur-sm p-6 rounded-lg border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-secondary w-4 h-4" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-white/20 focus:border-primary transition-all"
                />
              </div>
              
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="bg-background/50 border-white/20">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background border-white/20">
                  <SelectGroup>
                    <SelectItem value="all" className="focus:bg-primary/20">All Categories</SelectItem>
                    {securityResources.categories.map(category => (
                      <SelectItem key={category.name} value={category.name} className="focus:bg-primary/20">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-2">
                <Filter className="w-4 h-4 text-primary" />
                <span>Filter by tags (click multiple tags to see resources with any of the selected tags)</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 rounded-lg bg-background/30">
                {allTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                      selectedTags.includes(tag) 
                        ? 'bg-primary text-white hover:bg-primary/90' 
                        : 'hover:bg-primary/20 border-white/20'
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8 animate-fade-in">
            {filteredResources.map(category => (
              <div key={category.name} className="bg-secondary/30 p-6 rounded-lg border border-white/10">
                <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
                <p className="text-foreground-secondary mb-6">{category.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.tools.map(tool => (
                    <Card 
                      key={tool.title}
                      className="bg-background/50 backdrop-blur-sm border-white/10 p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden
                        before:content-[''] before:absolute before:inset-0 
                        before:bg-gradient-to-r before:from-primary/0 before:via-primary/5 before:to-primary/0 
                        before:translate-x-[-100%] before:opacity-0 before:transition-all before:duration-500
                        hover:before:translate-x-[100%] hover:before:opacity-100
                        hover:scale-[1.02] hover:-translate-y-1"
                    >
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-foreground-secondary mb-4">
                        {tool.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tool.tags.map(tag => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="text-xs border-white/20 bg-white/5"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        variant="outline"
                        className="w-full group-hover:bg-primary group-hover:text-white transition-all border-white/20"
                        onClick={() => window.open(tool.url, '_blank')}
                      >
                        Visit Resource
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-12 text-foreground-secondary">
              <p>No resources found matching your criteria.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Links;
