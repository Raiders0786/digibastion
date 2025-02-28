
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { FileText, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const License = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="License | Digibastion"
        description="View Digibastion's license information and terms of use. Our commitment to open source and community collaboration."
        type="website"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <FileText className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">License</h1>
            <p className="text-lg text-foreground-secondary mb-6">
              Terms of use and distribution for Digibastion Web3 Security Checklist
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open('https://github.com/Raiders0786/digibastion/blob/main/LICENSE', '_blank')}
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </Button>
          </div>

          <Card className="p-8 animate-slide-up space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">MIT License</h2>
              <p className="text-foreground-secondary mb-4">
                Copyright (c) {currentYear} Raiders
              </p>
              <div className="prose prose-invert max-w-none">
                <p className="mb-4">
                  Permission is hereby granted, free of charge, to any person obtaining a copy
                  of this software and associated documentation files (the "Software"), to deal
                  in the Software without restriction, including without limitation the rights
                  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                  copies of the Software, and to permit persons to whom the Software is
                  furnished to do so, subject to the following conditions:
                </p>
                <p className="mb-4">
                  The above copyright notice and this permission notice shall be included in all
                  copies or substantial portions of the Software.
                </p>
                <p className="mb-4">
                  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                  SOFTWARE.
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-4">Commons Clause Restriction</h2>
              <div className="prose prose-invert max-w-none">
                <p className="mb-4">
                  The Commons Clause is added to this license to restrict commercial usage:
                </p>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>You <strong>may not</strong> sell, lease, or provide paid services based on the Software without prior <strong>written permission</strong> from the copyright holder.</li>
                  <li>You <strong>may</strong> use, modify, and share the Software freely <strong>for non-commercial purposes.</strong></li>
                  <li>Open-source contributions, forks, and modifications <strong>are allowed</strong> as long as they comply with this license.</li>
                  <li>If you wish to use this Software commercially, please <strong>contact raiders@digibastion.com for licensing options.</strong></li>
                </ul>
                <p>
                  For details on the Commons Clause, visit:{' '}
                  <a 
                    href="https://commonsclause.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://commonsclause.com/
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default License;
