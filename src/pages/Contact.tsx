import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Mail, MessageSquare } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Mail className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Contact Digibastion</h1>
            <p className="text-lg text-foreground-secondary">
              Get in touch with our team
            </p>
          </div>

          <div className="grid gap-6 animate-slide-up">
            <div className="bg-card rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Send us a message</h2>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full p-3 rounded-md bg-background border border-white/10"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    className="w-full p-3 rounded-md bg-background border border-white/10 min-h-[120px]"
                    placeholder="Your message..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
