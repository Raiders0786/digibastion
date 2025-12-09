import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Shield, Github, Heart, Twitter, Link, Zap, Code, Users, Globe, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="About Digibastion — The Open-Source Web3 Security Platform | Secure the Stack"
        description="Learn about Digibastion's mission to make Web3 safer. Open-source platform with threat intelligence, OpSec assessments, and security scanners. Supported by Ethereum Foundation ESP 2025."
        type="website"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">About Digibastion</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Empowering users with knowledge and tools to navigate Web3 securely.
            </p>
          </div>

          <div className="space-y-16">
            {/* Mission Section */}
            <section id="mission" className="scroll-mt-24 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" />
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Digibastion was born from a simple observation: as Web3 continues to evolve and attract new users, 
                the need for accessible, comprehensive security guidance becomes increasingly important. Our mission 
                is to bridge this gap by providing practical, actionable security information that empowers users at 
                all technical levels to protect their digital assets and privacy.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card className="glass-card-hover p-6">
                  <Code className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-foreground">Education First</h3>
                  <p className="text-muted-foreground text-sm">
                    We believe that security literacy is the foundation of a safer Web3 ecosystem. 
                    Our detailed checklists and resources are designed to educate while providing 
                    practical solutions.
                  </p>
                </Card>
                <Card className="glass-card-hover p-6">
                  <Users className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-foreground">Community Driven</h3>
                  <p className="text-muted-foreground text-sm">
                    Digibastion is built by and for the community. We incorporate feedback, research, and 
                    real-world experiences to continuously improve our security guidance.
                  </p>
                </Card>
              </div>
            </section>

            <div className="divider" />

            {/* Contributors Section */}
            <section id="contributors" className="scroll-mt-24 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                <Globe className="w-6 h-6 text-primary" />
                Core Contributors
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Raiders */}
                <Card className="glass-card-hover p-5 cursor-pointer group" 
                  onClick={() => window.open('https://github.com/Raiders0786', '_blank')}>
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h3 className="text-base font-medium mb-1 group-hover:text-primary transition-colors">Raiders</h3>
                      <p className="text-xs text-primary mb-2">Project Founder</p>
                      <p className="text-muted-foreground text-xs">
                        Security researcher and blockchain enthusiast dedicated to making Web3 more secure.
                      </p>
                    </div>
                    <div className="mt-auto pt-3 flex items-center gap-2">
                      <a 
                        href="https://x.com/__Raiders" 
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                      <a 
                        href="https://github.com/Raiders0786" 
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </Card>

                {/* Vladimir S. */}
                <Card className="glass-card-hover p-5 cursor-pointer group"
                  onClick={() => window.open('https://x.com/officer_cia', '_blank')}>
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h3 className="text-base font-medium mb-1 group-hover:text-primary transition-colors">Vladimir S.</h3>
                      <p className="text-xs text-primary mb-2">Officer's Notes</p>
                      <p className="text-muted-foreground text-xs">
                        Security expert and Web3 educator helping review and provide valuable resources.
                      </p>
                    </div>
                    <div className="mt-auto pt-3 flex items-center gap-2">
                      <a 
                        href="https://x.com/officer_cia" 
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                      <a 
                        href="https://officercia.mirror.xyz" 
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Link className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </Card>

                {/* Riddham Bhaggat */}
                <Card className="glass-card-hover p-5 cursor-pointer group"
                  onClick={() => window.open('https://x.com/RasenRhino', '_blank')}>
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h3 className="text-base font-medium mb-1 group-hover:text-primary transition-colors">Riddham Bhaggat</h3>
                      <p className="text-xs text-primary mb-2">DNS Security Scanner</p>
                      <p className="text-muted-foreground text-xs">
                        Core contributor specializing in DNS security scanning and network analysis tools.
                      </p>
                    </div>
                    <div className="mt-auto pt-3 flex items-center gap-2">
                      <a 
                        href="https://x.com/RasenRhino" 
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </Card>

                {/* Open to Contributors */}
                <Card className="glass-card-hover p-5 cursor-pointer group border-dashed"
                  onClick={() => window.open('https://github.com/Raiders0786/digibastion/blob/main/CONTRIBUTING.md', '_blank')}>
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <h3 className="text-base font-medium mb-1 group-hover:text-primary transition-colors">Join Our Team</h3>
                      <p className="text-xs text-primary mb-2">Open to Contributors</p>
                      <p className="text-muted-foreground text-xs">
                        We welcome security researchers and developers passionate about Web3 safety.
                      </p>
                    </div>
                    <div className="mt-auto pt-3">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <Github className="w-3 h-3 mr-1.5" />
                        Contribute
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            <div className="divider" />

            {/* Values Section */}
            <section id="values" className="scroll-mt-24 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                <Heart className="w-6 h-6 text-primary" />
                Our Values
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  {
                    title: 'Accessibility',
                    description: 'Security information should be accessible to everyone, regardless of technical background. We present complex concepts in straightforward, actionable ways.'
                  },
                  {
                    title: 'Transparency',
                    description: "We're committed to transparent practices. We don't receive compensation for recommending specific tools - our focus is purely on security efficacy."
                  },
                  {
                    title: 'Continuous Improvement',
                    description: 'The security landscape evolves rapidly. We keep our guidance current with emerging threats through ongoing research and community feedback.'
                  },
                  {
                    title: 'Community Focus',
                    description: 'Security is a collective responsibility. By fostering a security-conscious community, we create a safer Web3 ecosystem for everyone.'
                  }
                ].map((value, index) => (
                  <div key={index} className="p-5 rounded-xl hover:bg-muted/30 transition-all duration-300">
                    <h3 className="text-base font-medium mb-2 text-foreground">{value.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="divider" />

            {/* Get Involved Section */}
            <section id="get-involved" className="scroll-mt-24 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" />
                Get Involved
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Digibastion is an evolving project, and we welcome contributions from the community. Whether it's 
                suggesting improvements to our checklists, reporting security issues, or helping spread the word 
                about digital security, your involvement helps make Web3 safer for everyone.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <a href="https://github.com/Raiders0786/digibastion" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <Github className="w-4 h-4" />
                    GitHub
                  </Button>
                </a>
                <a href="https://twitter.com/__Raiders" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="gap-2">
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </Button>
                </a>
                <Button variant="outline" className="gap-2" onClick={() => navigate('/contact')}>
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
