
import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { MetaTags } from '../components/MetaTags';
import { useForm } from 'react-hook-form';
import { useWeb3Forms } from '@web3forms/react';
import { MessageSquare, Send, Twitter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface FormData {
  name: string;
  email: string;
  inquiryType: string;
  socialHandle?: string;
  message: string;
}

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const { submit: submitForm } = useWeb3Forms({
    access_key: 'YOUR-ACCESS-KEY-HERE',
    settings: {
      from_name: 'Digibastion Contact Form',
      subject: 'New Contact Form Submission',
    },
    onSuccess: () => {
      setIsSubmitting(false);
      reset();
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you as soon as possible.",
      });
    },
    onError: () => {
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: "Please try again later.",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    await submitForm(data);
  };

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
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Let's Work Together!
            </h1>
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Whether you're interested in partnerships, sponsorships, or just want to say hello,
              we're excited to hear from you. Join us in making Web3 security more accessible
              for everyone!
            </p>
            
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                className="hover:bg-primary hover:text-background transition-all"
                onClick={() => window.open('https://t.me/digibastion', '_blank')}
              >
                <Send className="w-4 h-4 mr-2" />
                Contact on Telegram
              </Button>
              <Button
                variant="outline"
                className="hover:bg-primary hover:text-background transition-all"
                onClick={() => window.open('https://twitter.com/__Raiders', '_blank')}
              >
                <Twitter className="w-4 h-4 mr-2" />
                Follow on Twitter
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 shadow-lg border border-primary/10">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Get in Touch
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  {...register("name", { required: true })}
                  className="bg-background"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">Name is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register("email", {
                    required: true,
                    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  })}
                  className="bg-background"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">Valid email is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inquiryType">Inquiry Type</Label>
                <Select
                  {...register("inquiryType", { required: true })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select your inquiry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="sponsorship">Sponsorship</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.inquiryType && (
                  <p className="text-sm text-destructive">Please select an inquiry type</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialHandle">Social Handle (Optional)</Label>
                <Input
                  id="socialHandle"
                  placeholder="Your Twitter or Telegram handle"
                  {...register("socialHandle")}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your proposal or inquiry..."
                  {...register("message", { required: true })}
                  className="min-h-[150px] bg-background"
                />
                {errors.message && (
                  <p className="text-sm text-destructive">Message is required</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    Sending...
                    <Send className="w-4 h-4 animate-pulse" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send Message
                    <Send className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
