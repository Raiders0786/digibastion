import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Mail, MessageSquare, Twitter, Send, Handshake, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from 'zod';
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

// Input validation schema
const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  inquiryType: z.string().optional(),
  social: z.string().max(100, "Social handle must be less than 100 characters").optional(),
  meetingLink: z.string().url("Invalid URL").max(500, "URL must be less than 500 characters").optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

const Contact = () => {
  const [result, setResult] = useState("");
  const [inquiryType, setInquiryType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResult("Sending....");

    const formData = new FormData(event.target as HTMLFormElement);
    
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      inquiryType: inquiryType,
      social: formData.get("social") as string || "",
      meetingLink: formData.get("meetingLink") as string || "",
      message: formData.get("message") as string,
    };

    // Validate inputs
    const validation = contactSchema.safeParse(rawData);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Invalid input";
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });
      setResult("");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("submit-form", {
        body: { type: "contact", data: validation.data },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success!",
          description: "Your message has been sent successfully.",
        });
        setResult("Form Submitted Successfully");
        (event.target as HTMLFormElement).reset();
        setInquiryType("");
      } else {
        toast({
          title: "Error",
          description: data?.error || "Something went wrong. Please try again.",
          variant: "destructive",
        });
        setResult("");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setResult("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Contact Digibastion — Partnership, Collaboration & Support | Web3 Security"
        description="Get in touch with the Digibastion team. Explore partnership opportunities, report security issues, or collaborate on making Web3 safer. Backed by Ethereum Foundation ESP."
        keywords="contact digibastion, web3 security partnership, blockchain security collaboration, crypto security support, ethereum security team"
      />
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
                href="https://t.me/digibastion_chat"
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
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    maxLength={100}
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
                    maxLength={255}
                    className="w-full p-3 rounded-md bg-background border border-white/10"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Inquiry Type</label>
                  <Select
                    name="inquiryType"
                    value={inquiryType}
                    onValueChange={setInquiryType}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select your inquiry type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-white/10">
                      {INQUIRY_TYPES.map((type) => (
                        <SelectItem 
                          key={type.value} 
                          value={type.value}
                          className="focus:bg-primary/20 focus:text-foreground"
                        >
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Social Handle (Optional)</label>
                  <input
                    type="text"
                    name="social"
                    maxLength={100}
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
                      maxLength={500}
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
                    maxLength={2000}
                    className="w-full p-3 rounded-md bg-background border border-white/10 min-h-[120px]"
                    placeholder={inquiryType === 'meeting' ? 
                      "Please share some context about the meeting..." : 
                      "Tell us about your proposal or inquiry..."}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : (inquiryType === 'meeting' ? 'Request Meeting' : 'Send Message')}
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
