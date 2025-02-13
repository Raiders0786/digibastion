
import { toast } from "sonner";

export const handleShare = async (type: 'copy' | 'twitter' | 'email', url: string, title: string) => {
  switch (type) {
    case 'copy':
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
      break;
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
      break;
    case 'email':
      window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`, '_blank');
      break;
  }
};
