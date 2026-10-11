import { toast } from "sonner";
import { X_HANDLE } from "@/seo/siteFacts";
import { shareTargets } from "../../supabase/functions/_shared/share-links";
import { openExternalUrl } from "./safeUrl";

export const handleShare = async (type: 'copy' | 'twitter' | 'email', url: string, title: string) => {
  try {
    switch (type) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
        break;
      case 'twitter':
        // x.com intent with the link in `url=` so X builds the card, and our handle in `via=`.
        openExternalUrl(shareTargets({ url, text: title, via: X_HANDLE }).x);
        break;
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out Digibastion - your comprehensive guide to digital security: ${url}`)}`);
        break;
    }
  } catch (error) {
    console.error("Error sharing:", error);
    toast.error("Failed to share. Please try again.");
  }
};
