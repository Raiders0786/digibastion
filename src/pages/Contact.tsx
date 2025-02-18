
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Mail, MessageSquare, Twitter, Send, Handshake, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INQUIRY_TYPES = [
  { value: 'partnership', label: 'Partnership Opportunity' },
  { value: 'sponsorship', label: 'Sponsorship Discussion' },
  { value: 'collaboration', label: 'Collaboration Proposal' },
  { value: 'work', label: 'Working with Us' },
  { value: 'issue', label: 'Report an Issue' },
  { value: 'meeting', label: 'Schedule a Meeting' },
];

const Contact = () => {
  const [result, setResult] = useState("");
  const [inquiryType, setInquiryType] = useState<string>("");
  const { toast } = useToast();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult("Sending....");
    const formData = new FormData(event.target as HTMLFormElement);

    // Public Access Key - stored in environment variable for security
    const accessKey = import.meta.env.VITE_WEB3FORMS_KEY || "fd8fc32b-444d-4b96-bb87-70c8ce806ba2";
    formData.append("access_key", accessKey);

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
        setInquiryType("");
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
            <Handshake className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-foreground mb-4">Let's Work Together!</h1>
            <p className="text-lg text-foreground-secondary mb-6 max-w-2xl mx-auto">
              Whether you're interested in partnerships, sponsorships, or just want to say hello,
              we're excited to hear from you. Join us in making Web3 security more accessible for everyone!
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
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Get in Touch</h2>
              </div>
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Inquiry Type</label>
                  <Select
                    name="inquiryType"
                    value={inquiryType}
                    onValueChange={setInquiryType}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INQUIRY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                {inquiryType === 'meeting' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Meeting Link (Required)</label>
                    <input
                      type="url"
                      name="meetingLink"
                      required
                      className="w-full p-3 rounded-md bg-background border border-white/10"
                      placeholder="Your Calendly/Cal.com link"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    name="message"
                    required
                    className="w-full p-3 rounded-md bg-background border border-white/10 min-h-[120px]"
                    placeholder={inquiryType === 'meeting' ? 
                      "Please share some context about the meeting..." : 
                      "Tell us about your proposal or inquiry..."}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {inquiryType === 'meeting' ? 'Request Meeting' : 'Send Message'}
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
