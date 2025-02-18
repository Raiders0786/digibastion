
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Mail, MessageSquare, Twitter, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [result, setResult] = useState("");
  const { toast } = useToast();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult("Sending....");
    const formData = new FormData(event.target as HTMLFormElement);

    // Public Access Key
    formData.append("access_key", "fd8fc32b-444d-4b96-bb87-70c8ce806ba2");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success!",
          description: "Your message has been sent successfully.",
        });
        setResult("Form Submitted Successfully");
        (event.target as HTMLFormElement).reset();
      } else {
        console.log("Error", data);
        setResult(data.message);
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <Mail className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Contact Digibastion</h1>
            <p className="text-lg text-foreground-secondary mb-6">
              Get in touch with our team
            </p>
            <div className="flex justify-center gap-4 mb-8">
              <a
                href="https://t.me/raiders0786"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" className="gap-2">
                  <Send className="w-4 h-4" />
                  Contact on Telegram
                </Button>
              </a>
              <a
                href="https://x.com/__Raiders"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" className="gap-2">
                  <Twitter className="w-4 h-4" />
                  Follow on Twitter
                </Button>
              </a>
            </div>
          </div>

          <div className="grid gap-6 animate-slide-up">
            <div className="bg-card rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Send us a message</h2>
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full p-3 rounded-md bg-background border border-white/10"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full p-3 rounded-md bg-background border border-white/10"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Social Handle (Optional)</label>
                  <input
                    type="text"
                    name="social"
                    className="w-full p-3 rounded-md bg-background border border-white/10"
                    placeholder="Your Twitter or Telegram handle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    name="message"
                    required
                    className="w-full p-3 rounded-md bg-background border border-white/10 min-h-[120px]"
                    placeholder="Your message..."
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  Send Message
                </Button>
              </form>
              {result && (
                <div className="mt-4 text-center text-sm text-foreground-secondary">
                  {result}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
