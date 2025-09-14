import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Share2, 
  Copy, 
  MessageCircle, 
  Send, 
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Mail
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url?: string;
  description?: string;
}

export const ShareModal = ({ 
  isOpen, 
  onClose, 
  title, 
  url = window.location.href,
  description = ""
}: ShareModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard."
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive"
      });
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${title}\n${description}\n${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(`${title}\n${description}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
  };

  const shareToMessenger = () => {
    // Facebook Messenger sharing
    window.open(`https://www.messenger.com/t/?link=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${title}\n${description}`);
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`, '_blank');
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareOptions = [
    {
      id: "native",
      name: "Share",
      icon: Share2,
      color: "text-primary",
      action: async () => {
        if ('share' in navigator) {
          await navigator.share({ title, url, text: description });
        } else {
          await copyToClipboard();
        }
      }
    },
    {
      id: "copy",
      name: "Copy Link",
      icon: Copy,
      color: "text-muted-foreground",
      action: copyToClipboard
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "text-green-600",
      action: () => shareToWhatsApp()
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: Send,
      color: "text-blue-500",
      action: () => shareToTelegram()
    },
    {
      id: "messenger",
      name: "Messenger",
      icon: Facebook,
      color: "text-blue-600",
      action: () => shareToMessenger()
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-700",
      action: () => shareToFacebook()
    },
    {
      id: "twitter",
      name: "Twitter",
      icon: Twitter,
      color: "text-sky-500",
      action: () => shareToTwitter()
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-800",
      action: () => shareToLinkedIn()
    },
    {
      id: "email",
      name: "Email",
      icon: Mail,
      color: "text-gray-600",
      action: () => shareViaEmail()
    }
  ];

  const handleShare = async (option: typeof shareOptions[0]) => {
    setIsLoading(option.id);
    try {
      await option.action();
      onClose();
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Sharing failed",
        description: "Unable to share at this time. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this content</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-3 py-4">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.id}
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => handleShare(option)}
                disabled={isLoading === option.id}
              >
                <Icon className={`w-6 h-6 ${option.color}`} />
                <span className="text-xs">{option.name}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};