import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { PhotoModal } from "@/components/photo-modal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginModalContent from "@/components/login-modal-content";

interface PostCardProps {
  id?: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  authorProfileId?: string;
  time: string;
  content: string;
  imageSrc?: string;
  likes?: number;
  comments?: number;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
  return initials || "U";
};

const PostCard = ({
  id = `post-${Math.random()}`,
  authorName,
  authorAvatarUrl,
  authorProfileId,
  time,
  content,
  imageSrc,
  likes = 0,
  comments = 0,
}: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  // Check if post is liked by current user
  useEffect(() => {
    if (!currentUserId) return;
    
    const checkLiked = async () => {
      const { data } = await supabase
        .from("likes")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("content_type", "post")
        .eq("content_id", id)
        .maybeSingle();
      
      setIsLiked(!!data);
    };
    
    checkLiked();
  }, [currentUserId, id]);

  const handleLike = async () => {
    if (!currentUserId) {
      toast({ description: "Войдите, чтобы ставить лайки" });
      return;
    }

    setLoading(true);
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("content_type", "post")
          .eq("content_id", id);
        
        if (error) throw error;
        
        setIsLiked(false);
        setCurrentLikes(prev => Math.max(0, prev - 1));
        toast({ description: "Лайк убран" });
      } else {
        // Like
        const { error } = await supabase
          .from("likes")
          .insert({
            user_id: currentUserId,
            content_type: "post",
            content_id: id,
          });
        
        if (error) throw error;
        
        setIsLiked(true);
        setCurrentLikes(prev => prev + 1);
        toast({ description: "Пост понравился!" });
      }
    } catch (error) {
      toast({ description: "Не удалось выполнить действие" });
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    if (imageSrc) setIsModalOpen(true);
  };

  const handleComment = () => {
    if (!currentUserId) {
      setShowLoginModal(true);
      return;
    }
    
    openModal();
  };

  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden">
        {/* Header with author info */}
        <div className="flex items-center gap-3 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorAvatarUrl ?? undefined} alt={`Avatar ${authorName}`} />
            <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1">
            {authorProfileId ? (
              <Link 
                to={`/u/${authorProfileId}`}
                className="font-medium leading-none hover:underline text-primary"
              >
                {authorName}
              </Link>
            ) : (
              <span className="font-medium leading-none">{authorName}</span>
            )}
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 pt-0 pb-3">
          {content && <p className="text-sm whitespace-pre-line mb-3">{content}</p>}
        </div>
        
        {imageSrc && (
          <div className="relative">
            <img
              src={imageSrc}
              alt={`Post image — ${authorName}`}
              loading="lazy"
              className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={openModal}
            />
          </div>
        )}

        {/* Footer with actions - exact copy from full contest cards */}
        <div className="border-t border-contest-border px-4 py-2 flex items-center justify-evenly gap-4">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors",
              isLiked && "text-contest-blue"
            )}
            onClick={handleLike}
            disabled={loading}
            aria-label="Like"
          >
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Like</span>
            <span>{currentLikes}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleComment}
            aria-label="Comments"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Comment</span>
            <span>{comments}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={async () => {
              try {
                if ((navigator as any).share) {
                  await (navigator as any).share({ title: `Post by ${authorName}`, url: window.location.href });
                } else if (navigator.clipboard) {
                  await navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link copied" });
                }
              } catch {}
            }}
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </Card>

      {imageSrc && (
        <PhotoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          photos={[imageSrc]}
          currentIndex={0}
          contestantName={authorName}
          age={0}
          weight={0}
          height={0}
          country=""
          city=""
        />
      )}

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-lg">
          <LoginModalContent onClose={() => setShowLoginModal(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostCard;