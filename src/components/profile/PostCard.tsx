import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";
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
  mediaUrls?: string[];
  mediaTypes?: string[];
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
  mediaUrls,
  mediaTypes,
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

  const displayMediaUrls = mediaUrls && mediaUrls.length > 0 ? mediaUrls : (imageSrc ? [imageSrc] : []);
  const displayMediaTypes = mediaTypes && mediaTypes.length > 0 ? mediaTypes : (imageSrc ? ['image'] : []);

  const openModal = () => {
    if (displayMediaUrls.length > 0) setIsModalOpen(true);
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
        <div className="px-3 pt-0 pb-1">
          {content && <p className="text-sm whitespace-pre-line mb-1">{content}</p>}
        </div>
        
        {/* Media display */}
        {displayMediaUrls.length > 0 && (
          <div className="relative">
            {displayMediaUrls.length === 1 ? (
              displayMediaTypes[0] === 'video' ? (
                <video
                  src={displayMediaUrls[0]}
                  controls
                  className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={openModal}
                />
              ) : (
                <img
                  src={displayMediaUrls[0]}
                  alt={`Post media — ${authorName}`}
                  loading="lazy"
                  className="w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={openModal}
                />
              )
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {displayMediaUrls.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative aspect-square">
                    {displayMediaTypes[index] === 'video' ? (
                      <video
                        src={url}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={openModal}
                      />
                    ) : (
                      <img
                        src={url}
                        alt={`Post media ${index + 1} — ${authorName}`}
                        loading="lazy"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={openModal}
                      />
                    )}
                    {index === 3 && displayMediaUrls.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                        +{displayMediaUrls.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
            <ThumbsUp className="w-4 h-4" strokeWidth={1} />
            <span className="hidden sm:inline">Like</span>
            <span>{currentLikes}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleComment}
            aria-label="Comments"
          >
            <MessageCircle className="w-4 h-4" strokeWidth={1} />
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

      {displayMediaUrls.length > 0 && (
        <PhotoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          photos={displayMediaUrls}
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