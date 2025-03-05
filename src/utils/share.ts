
import { toast } from "sonner";

export const handleShare = async (
  type: 'copy' | 'twitter' | 'linkedin' | 'reddit' | 'email', 
  url: string, 
  title: string
) => {
  try {
    switch (type) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        break;
      case 'twitter':
        // Format the tweet with title and URL
        const tweetText = encodeURIComponent(`${title}\n\n${url}`);
        window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'reddit':
        window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this security guide: ${url}`)}`);
        break;
    }
  } catch (error) {
    console.error("Error sharing:", error);
    toast.error("Failed to share. Please try again.");
  }
};
