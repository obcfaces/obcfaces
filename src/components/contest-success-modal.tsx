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
import { useState } from "react";

interface ContestSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url?: string;
  description?: string;
}

export const ContestSuccessModal = ({ 
  isOpen, 
  onClose, 
  title, 
  url = window.location.href,
  description = ""
}: ContestSuccessModalProps) => {
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

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareToInstagram = () => {
    // Instagram doesn't have direct web sharing, so we copy the link
    copyToClipboard();
    toast({
      title: "Link copied!",
      description: "Open Instagram and paste the link in your story or post."
    });
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
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-700",
      action: () => shareToFacebook()
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      color: "text-pink-600",
      action: () => shareToInstagram()
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: Send,
      color: "text-blue-500",
      action: () => shareToTelegram()
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "text-green-600",
      action: () => shareToWhatsApp()
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
    },
    {
      id: "copy",
      name: "Copy Link",
      icon: Copy,
      color: "text-muted-foreground",
      action: copyToClipboard
    }
  ];

  const handleShare = async (option: typeof shareOptions[0]) => {
    setIsLoading(option.id);
    try {
      await option.action();
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
          <DialogTitle className="text-center text-xl font-bold text-primary">
            You're in! Your Chance to Shine ✨
          </DialogTitle>
          <div className="text-center">
            <p className="text-sm font-bold text-black mt-2">
              Tip: More shares = More votes = Bigger chance to win 🏆
            </p>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Invite your friends, family, and followers to support you by giving their votes — more votes, more chances to win!
            </p>
            
            <p className="text-sm text-muted-foreground">
              Share your contest card in social media and messengers with everyone who can vote for you. Every share brings you closer to winning!
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Share</h3>
            
            <div className="grid grid-cols-4 gap-3">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.id}
                    variant="outline"
                    className="h-16 flex flex-col gap-1 p-2"
                    onClick={() => handleShare(option)}
                    disabled={isLoading === option.id}
                  >
                    <Icon className={`w-5 h-5 ${option.color}`} />
                    <span className="text-xs leading-tight">{option.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="text-center">
            <Button onClick={onClose} className="w-full">
              🔥 Invite Friends
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};