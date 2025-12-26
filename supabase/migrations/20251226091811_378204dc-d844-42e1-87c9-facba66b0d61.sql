-- Create news_articles table for storing fetched RSS articles
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE, -- SHA256 hash for deduplication
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  link TEXT NOT NULL,
  source_url TEXT,
  source_name TEXT,
  category TEXT NOT NULL DEFAULT 'web3-security',
  severity TEXT NOT NULL DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  affected_technologies TEXT[] DEFAULT '{}',
  author TEXT,
  cve_id TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_processed BOOLEAN DEFAULT false, -- For future AI processing
  raw_content TEXT -- Store original RSS content
);

-- Create rss_feeds table for managing feed sources
CREATE TABLE public.rss_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_keywords table for filtering
CREATE TABLE public.security_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  weight INTEGER DEFAULT 1, -- Higher weight = more relevant
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_keywords ENABLE ROW LEVEL SECURITY;

-- Public read access for news articles (open source, no auth required)
CREATE POLICY "Anyone can view news articles" 
ON public.news_articles 
FOR SELECT 
USING (true);

-- Public read access for RSS feeds list
CREATE POLICY "Anyone can view RSS feeds" 
ON public.rss_feeds 
FOR SELECT 
USING (true);

-- Public read access for keywords
CREATE POLICY "Anyone can view keywords" 
ON public.security_keywords 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_news_articles_published_at ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_articles_category ON public.news_articles(category);
CREATE INDEX idx_news_articles_severity ON public.news_articles(severity);
CREATE INDEX idx_news_articles_uid ON public.news_articles(uid);
CREATE INDEX idx_news_articles_tags ON public.news_articles USING GIN(tags);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_news_articles_updated_at
BEFORE UPDATE ON public.news_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial RSS feeds
INSERT INTO public.rss_feeds (name, url, category) VALUES
  ('The Hacker News', 'https://feeds.feedburner.com/TheHackersNews', 'general'),
  ('BleepingComputer', 'https://www.bleepingcomputer.com/feed/', 'general'),
  ('SecurityWeek', 'https://feeds.feedburner.com/securityweek', 'general'),
  ('CISA Alerts', 'https://www.cisa.gov/uscert/ncas/alerts.xml', 'vulnerability-disclosure'),
  ('Dark Reading', 'https://www.darkreading.com/rss.xml', 'general'),
  ('Krebs on Security', 'https://krebsonsecurity.com/feed/', 'general'),
  ('Naked Security', 'https://nakedsecurity.sophos.com/feed/', 'general');

-- Insert initial security keywords (comprehensive list matching your Python script + Digibastion focus)
INSERT INTO public.security_keywords (keyword, category, weight) VALUES
  -- Vulnerability keywords
  ('cve', 'vulnerability', 3),
  ('exploit', 'vulnerability', 3),
  ('vulnerability', 'vulnerability', 3),
  ('zero-day', 'vulnerability', 3),
  ('0day', 'vulnerability', 3),
  ('0-day', 'vulnerability', 3),
  ('zero day', 'vulnerability', 3),
  ('remote code execution', 'vulnerability', 3),
  ('rce', 'vulnerability', 3),
  ('lpe', 'vulnerability', 2),
  ('xss', 'vulnerability', 2),
  ('csrf', 'vulnerability', 2),
  ('sql injection', 'vulnerability', 2),
  ('sqli', 'vulnerability', 2),
  ('command injection', 'vulnerability', 2),
  ('deserialization', 'vulnerability', 2),
  ('auth bypass', 'vulnerability', 3),
  ('path traversal', 'vulnerability', 2),
  ('privilege escalation', 'vulnerability', 3),
  ('unauthorized access', 'vulnerability', 2),
  -- Threat keywords
  ('cyber attack', 'threat', 2),
  ('cyber threat', 'threat', 2),
  ('cybersecurity', 'general', 1),
  ('security issue', 'general', 1),
  ('critical bug', 'vulnerability', 2),
  ('security advisory', 'vulnerability', 2),
  -- Breach keywords
  ('breach', 'breach', 3),
  ('data leak', 'breach', 3),
  ('data breach', 'breach', 3),
  ('info leak', 'breach', 2),
  ('exposed', 'breach', 2),
  ('hack', 'breach', 3),
  ('hacked', 'breach', 3),
  ('hacking', 'breach', 2),
  -- Malware keywords
  ('ransomware', 'malware', 3),
  ('malware', 'malware', 3),
  ('backdoor', 'malware', 3),
  ('rootkit', 'malware', 3),
  ('apt', 'threat', 3),
  ('mitm', 'attack', 2),
  ('ddos', 'attack', 2),
  ('botnet', 'malware', 2),
  -- Patch/Update keywords
  ('patch', 'patch', 2),
  ('patch released', 'patch', 2),
  ('security update', 'patch', 2),
  -- Social engineering
  ('credentials', 'breach', 2),
  ('social engineering', 'attack', 3),
  ('phishing', 'attack', 3),
  ('supply chain attack', 'supply-chain', 3),
  ('supply-chain', 'supply-chain', 3),
  -- Nation state
  ('nation state', 'threat', 3),
  ('threat actor', 'threat', 3),
  ('lazarus', 'threat', 3),
  ('north korea', 'threat', 3),
  ('dprk', 'threat', 3),
  -- Technical
  ('firmware', 'vulnerability', 2),
  ('kernel', 'vulnerability', 2),
  ('CISA', 'vulnerability', 2),
  ('MITRE', 'vulnerability', 2),
  ('pwn', 'vulnerability', 2),
  ('leaked', 'breach', 2),
  ('hacktivist', 'threat', 2),
  -- Web3/Crypto specific (Digibastion focus)
  ('wallet', 'web3', 3),
  ('metamask', 'web3', 3),
  ('ledger', 'web3', 3),
  ('trezor', 'web3', 3),
  ('phantom', 'web3', 3),
  ('defi', 'web3', 3),
  ('smart contract', 'web3', 3),
  ('solidity', 'web3', 2),
  ('ethereum', 'web3', 2),
  ('bitcoin', 'web3', 2),
  ('solana', 'web3', 2),
  ('private key', 'web3', 3),
  ('seed phrase', 'web3', 3),
  ('mnemonic', 'web3', 2),
  ('multisig', 'web3', 2),
  ('gnosis safe', 'web3', 2),
  ('reentrancy', 'web3', 3),
  ('flash loan', 'web3', 2),
  ('oracle manipulation', 'web3', 2),
  ('bridge exploit', 'web3', 3),
  ('token approval', 'web3', 2),
  ('exchange hack', 'web3', 3),
  ('hot wallet', 'web3', 2),
  ('cold storage', 'web3', 2),
  -- Supply chain specific
  ('npm', 'supply-chain', 3),
  ('pypi', 'supply-chain', 3),
  ('github', 'supply-chain', 2),
  ('dependency', 'supply-chain', 2),
  ('package', 'supply-chain', 2),
  ('typosquatting', 'supply-chain', 3),
  ('malicious package', 'supply-chain', 3),
  -- OPSEC keywords
  ('opsec', 'opsec', 3),
  ('operational security', 'opsec', 3),
  ('privacy', 'opsec', 2),
  ('vpn', 'opsec', 2),
  ('tor', 'opsec', 2),
  ('encryption', 'opsec', 2),
  ('2fa', 'opsec', 2),
  ('mfa', 'opsec', 2),
  ('password manager', 'opsec', 2);