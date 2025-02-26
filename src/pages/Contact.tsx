import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Mail } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Contact Us | Digibastion"
        description="Get in touch with the Digibastion team. Share your feedback, report issues, or join our community of Web3 security enthusiasts."
        type="website"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Mail className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-foreground-secondary">
              We'd love to hear from you! Whether you have feedback, questions, or just want to connect, feel free to reach out.
            </p>
          </div>

          <div className="bg-card rounded-lg p-6 animate-slide-up">
            <p className="text-foreground-secondary mb-6">
              You can contact us via email at:
            </p>

            <div className="flex justify-center">
              <a
                href="mailto:contact@digibastion.com"
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors text-center"
              >
                contact@digibastion.com
              </a>
            </div>

            <p className="text-foreground-secondary mt-6">
              We aim to respond to all inquiries within 48 hours.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
