
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Shield, Github, Heart, Twitter, Link, Zap, Code, Users, Globe, Gift, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="About Digibastion | Web3 Security Platform"
        description="Learn about Digibastion's mission to make Web3 safer through comprehensive security checklists, tools, and resources. Join our community of security-conscious developers and users."
        type="website"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">About Digibastion</h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Empowering users with knowledge and tools to navigate Web3 securely.
            </p>
          </div>

          <div className="grid gap-12 animate-slide-up">
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Our Mission
              </h2>
              <p className="text-foreground-secondary">
                Digibastion was born from a simple observation: as Web3 continues to evolve and attract new users, 
                the need for accessible, comprehensive security guidance becomes increasingly important. Our mission 
                is to bridge this gap by providing practical, actionable security information that empowers users at 
                all technical levels to protect their digital assets and privacy.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card className="p-6 bg-card border border-white/10 hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
                  <Code className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Education First</h3>
                  <p className="text-foreground-secondary text-sm">
                    We believe that security literacy is the foundation of a safer Web3 ecosystem. 
                    Our detailed checklists and resources are designed to educate while providing 
                    practical solutions.
                  </p>
                </Card>
                <Card className="p-6 bg-card border border-white/10 hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
                  <Users className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Community Driven</h3>
                  <p className="text-foreground-secondary text-sm">
                    Digibastion is built by and for the community. We incorporate feedback, research, and 
                    real-world experiences to continuously improve our security guidance.
                  </p>
                </Card>
              </div>
            </section>

            <Separator className="border-white/10" />

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <Globe className="w-6 h-6 text-primary" />
                Core Contributors
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 bg-card/50 border border-white/10 hover:bg-card/80 transition-colors hover:scale-105 duration-300 cursor-pointer group" 
                  onClick={() => window.open('https://github.com/Raiders0786', '_blank')}>
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-1 group-hover:text-primary transition-colors">Raiders</h3>
                      <p className="text-foreground-secondary text-sm mb-3">Project Founder</p>
                      <p className="text-foreground-secondary text-sm">
                        Security researcher and blockchain enthusiast dedicated to making Web3 more secure and accessible.
                      </p>
                    </div>
                    <div className="mt-auto pt-4 flex items-center gap-3">
                      <a 
                        href="https://x.com/__Raiders" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground-secondary hover:text-primary transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                      <a 
                        href="https://github.com/Raiders0786" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground-secondary hover:text-primary transition-colors"
                      >
                        <Github className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card/50 border border-white/10 hover:bg-card/80 transition-colors hover:scale-105 duration-300 cursor-pointer group"
                  onClick={() => window.open('https://x.com/officer_cia', '_blank')}>
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-1 group-hover:text-primary transition-colors">Vladimir S.</h3>
                      <p className="text-foreground-secondary text-sm mb-3">Officer's Notes</p>
                      <p className="text-foreground-secondary text-sm">
                        Security expert and Web3 educator continuously helping review and provide valuable tools and resources.
                      </p>
                    </div>
                    <div className="mt-auto pt-4 flex items-center gap-3">
                      <a 
                        href="https://x.com/officer_cia" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground-secondary hover:text-primary transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                      <a 
                        href="https://officercia.mirror.xyz" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground-secondary hover:text-primary transition-colors"
                      >
                        <Link className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card/50 border border-white/10 hover:bg-card/80 transition-colors hover:scale-105 duration-300 cursor-pointer group"
                  onClick={() => window.open('https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md', '_blank')}>
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-1 group-hover:text-primary transition-colors">Open to Contributors</h3>
                      <p className="text-foreground-secondary text-sm mb-3">Join Our Mission</p>
                      <p className="text-foreground-secondary text-sm">
                        We welcome security researchers, designers, and content creators passionate about making Web3 safer.
                      </p>
                    </div>
                    <div className="mt-auto pt-4">
                      <a 
                        href="https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md" 
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="w-full group-hover:bg-primary/20 transition-all">
                          <Github className="w-4 h-4 mr-2" />
                          Contribute
                        </Button>
                      </a>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            <Separator className="border-white/10" />

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-6 h-6 text-primary" />
                Our Values
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3 p-4 rounded-lg hover:bg-card/50 transition-all duration-300">
                  <h3 className="text-lg font-medium">Accessibility</h3>
                  <p className="text-foreground-secondary text-sm">
                    Security information should be accessible to everyone, regardless of technical background. 
                    We strive to present complex security concepts in straightforward, actionable ways.
                  </p>
                </div>
                <div className="space-y-3 p-4 rounded-lg hover:bg-card/50 transition-all duration-300">
                  <h3 className="text-lg font-medium">Transparency</h3>
                  <p className="text-foreground-secondary text-sm">
                    We're committed to transparent practices in our recommendations. We don't receive 
                    compensation for recommending specific tools or services - our focus is purely on security efficacy.
                  </p>
                </div>
                <div className="space-y-3 p-4 rounded-lg hover:bg-card/50 transition-all duration-300">
                  <h3 className="text-lg font-medium">Continuous Improvement</h3>
                  <p className="text-foreground-secondary text-sm">
                    The security landscape evolves rapidly. We're dedicated to keeping our guidance current 
                    with emerging threats and best practices through ongoing research and community feedback.
                  </p>
                </div>
                <div className="space-y-3 p-4 rounded-lg hover:bg-card/50 transition-all duration-300">
                  <h3 className="text-lg font-medium">Community Focus</h3>
                  <p className="text-foreground-secondary text-sm">
                    We believe that security is a collective responsibility. By fostering a security-conscious 
                    community, we can create a safer Web3 ecosystem for everyone.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="border-white/10" />

            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Get Involved
              </h2>
              <p className="text-foreground-secondary">
                Digibastion is an evolving project, and we welcome contributions from the community. Whether it's 
                suggesting improvements to our checklists, reporting security issues, or helping spread the word 
                about digital security, your involvement helps make Web3 safer for everyone.
              </p>
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start mt-4">
                <a 
                  href="https://github.com/Raiders0786/digibastion"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2 hover:bg-primary/20 transition-all">
                    <Github className="w-4 h-4" />
                    GitHub
                  </Button>
                </a>
                <a 
                  href="https://twitter.com/__Raiders"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2 hover:bg-primary/20 transition-all">
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </Button>
                </a>
                <Button variant="outline" className="gap-2 hover:bg-primary/20 transition-all" onClick={() => window.location.pathname = '/contact'}>
                  <Mail className="w-4 h-4" />
                  Contact Us
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
