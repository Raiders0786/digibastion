
import { toast } from "sonner";

export const handleShare = async (type: 'copy' | 'twitter' | 'email', url: string, title: string) => {
  try {
    switch (type) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out Digibastion - your comprehensive guide to Web3 security: ${url}`)}`);
        break;
    }
  } catch (error) {
    console.error("Error sharing:", error);
    toast.error("Failed to share. Please try again.");
  }
};
