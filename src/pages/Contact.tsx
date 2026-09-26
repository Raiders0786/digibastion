import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { Link } from 'react-router-dom';
import { ArrowRight, Bug, Mail, MessageSquare, ShieldCheck, Twitter } from 'lucide-react';
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
  { value: 'services', label: 'Security service or assessment' },
  { value: 'vantage', label: 'Vantage product or beta access' },
  { value: 'partnership', label: 'Partnership or sponsorship' },
  { value: 'contribution', label: 'Contribution or research idea' },
  { value: 'content', label: 'Correction to published content' },
  { value: 'other', label: 'Something else' },
];

// Input validation schema
const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  inquiryType: z.string().optional(),
  social: z.string().max(100, "Social handle must be less than 100 characters").optional(),
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
        title="Contact Digibastion — Services, Vantage, Research & Contributions"
        description="Contact Digibastion about security services, Vantage, partnerships, research corrections, responsible disclosure, or contributions."
        keywords="contact Digibastion, Vantage security, Web3 security services, responsible disclosure, security collaboration"
      />
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 animate-fade-in">
            <MessageSquare className="w-14 h-14 text-primary mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">Start with the problem.</h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto leading-8">
              Tell us what you are protecting, what changed, and what decision you need to make. We will route the message to the right product, service or contribution path.
            </p>
            <div className="flex justify-center gap-4 mb-8">
              <a
                href="mailto:raiders@digibastion.com"
                className="inline-flex"
              >
                <Button variant="outline" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Email directly
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

          <div className="grid gap-4 sm:grid-cols-3 mb-8">
            <Link to="/services" className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-semibold">Need an assessment?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Review the available OpSec and full-stack engagements first.</p>
              <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">Services <ArrowRight className="ml-1 h-4 w-4" /></span>
            </Link>
            <a href="https://vantage.digibastion.com/signup/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-semibold">Trying Vantage?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Request beta access for domain-security monitoring and workflow.</p>
              <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">Request access <ArrowRight className="ml-1 h-4 w-4" /></span>
            </a>
            <a href="mailto:raiders@digibastion.com?subject=Private%20security%20report" className="rounded-xl border border-border bg-card p-5 hover:border-destructive/50 transition-colors">
              <Bug className="h-5 w-5 text-destructive" />
              <h2 className="mt-3 font-semibold">Found a vulnerability?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Send a private report. Do not publish exploit details in a public issue.</p>
              <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">Report privately <ArrowRight className="ml-1 h-4 w-4" /></span>
            </a>
          </div>

          <div className="grid gap-6 animate-slide-up">
            <div className="bg-card rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Get in Touch</h2>
              </div>
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium mb-2">Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    required
                    maxLength={100}
                    className="w-full p-3 rounded-md bg-background border border-white/10"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium mb-2">Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    required
                    maxLength={255}
                    className="w-full p-3 rounded-md bg-background border border-white/10"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="contact-inquiry-type" className="block text-sm font-medium mb-2">Inquiry Type</label>
                  <Select
                    name="inquiryType"
                    value={inquiryType}
                    onValueChange={setInquiryType}
                  >
                    <SelectTrigger id="contact-inquiry-type" className="w-full bg-background">
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
                  <label htmlFor="contact-social" className="block text-sm font-medium mb-2">Social Handle (Optional)</label>
                  <input
                    id="contact-social"
                    type="text"
                    name="social"
                    maxLength={100}
                    className="w-full p-3 rounded-md bg-background border border-white/10"
                    placeholder="Your Twitter or Telegram handle"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    maxLength={2000}
                    className="w-full p-3 rounded-md bg-background border border-white/10 min-h-[120px]"
                    placeholder="What are you trying to protect or improve? Include useful context, but never send passwords, seed phrases, private keys, or production credentials."
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send message'}
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
