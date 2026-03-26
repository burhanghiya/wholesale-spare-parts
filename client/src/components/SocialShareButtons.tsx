import { Share2, Facebook, Twitter, Instagram, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface SocialShareButtonsProps {
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  showText?: boolean;
}

export function SocialShareButtons({
  title,
  description = "",
  url = typeof window !== "undefined" ? window.location.href : "",
  imageUrl = "",
  showText = true,
}: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareData = {
    title,
    text: description || title,
    url,
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      title
    )}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const handleInstagramShare = () => {
    // Instagram doesn't support direct sharing via URL, so we'll copy the link and show a toast
    navigator.clipboard.writeText(url).then(() => {
      toast.info("Link copied! Open Instagram and share it in your story or post.");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch((err) => {
      console.error("Failed to copy link:", err);
      toast.error("Failed to copy link");
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>

      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          {showText && "Share"}
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={handleFacebookShare}
        className="gap-2 text-blue-600 hover:text-blue-700"
      >
        <Facebook className="h-4 w-4" />
        {showText && "Facebook"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="gap-2 text-sky-500 hover:text-sky-600"
      >
        <Twitter className="h-4 w-4" />
        {showText && "Twitter"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleInstagramShare}
        className="gap-2 text-pink-600 hover:text-pink-700"
      >
        <Instagram className="h-4 w-4" />
        {showText && "Instagram"}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2"
      >
        <LinkIcon className="h-4 w-4" />
        {showText && (copied ? "Copied!" : "Copy Link")}
      </Button>
    </div>
  );
}
