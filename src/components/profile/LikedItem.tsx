import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { PhotoModal } from "@/components/photo-modal";
import { Link } from "react-router-dom";

// Import contest images for mock display
import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";

interface LikedItemProps {
  likeId: string;
  contentType: 'post' | 'photo' | 'contest';
  contentId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorProfileId?: string; // Add profile ID for linking
  time: string;
  content?: string;
  imageSrc?: string;
  likes?: number;
  comments?: number;
  onUnlike?: (likeId: string) => void;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
  return initials || "U";
};

const LikedItem = ({
  likeId,
  contentType,
  authorName,
  authorAvatarUrl,
  authorProfileId,
  time,
  content,
  imageSrc,
  likes = 0,
  comments = 0,
  onUnlike
}: LikedItemProps) => {
  const [isUnliking, setIsUnliking] = useState(false);
  const [isLiked, setIsLiked] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);

  const handleUnlike = async () => {
    setIsUnliking(true);
    try {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", likeId);
      
      if (error) throw error;
      
      setIsLiked(false);
      onUnlike?.(likeId);
      toast({ description: "Лайк убран" });
    } catch (error) {
      toast({ description: "Не удалось убрать лайк" });
    } finally {
      setIsUnliking(false);
    }
  };

  const openModal = (photoIndex: number) => {
    setModalStartIndex(photoIndex);
    setIsModalOpen(true);
  };

  // For contest items, render in contest card style
  if (contentType === 'contest') {
    const images = [contestant1Face, contestant2Face, contestant3Face];
    const fullImages = [contestant1Full, contestant2Full, contestant3Full];
    const randomIndex = Math.floor(Math.random() * images.length);
    const allPhotos = [images[randomIndex], fullImages[randomIndex]];
    
    return (
      <>
        <Card className="bg-card border-contest-border relative overflow-hidden flex h-32 sm:h-36 md:h-40">
          {/* Main two photos */}
          <div className="flex-shrink-0 flex h-full relative gap-px">
            <div className="relative">
              <img 
                src={images[randomIndex]} 
                alt={`${authorName} face`}
                className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(0)}
              />
            </div>
            <div className="relative">
              <img 
                src={fullImages[randomIndex]} 
                alt={`${authorName} full body`}
                className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(1)}
              />
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex-1 p-1.5 sm:p-2 md:p-3 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 mr-2">
                {authorProfileId ? (
                  <Link 
                    to={`/u/${authorProfileId}`}
                    className="font-semibold text-contest-text text-base sm:text-lg truncate hover:text-primary underline-offset-2 hover:underline"
                  >
                    {authorName}, 25
                  </Link>
                ) : (
                  <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">{authorName}, 25</h3>
                )}
                <div className="text-xs sm:text-sm text-muted-foreground font-normal">52 kg · 168 cm</div>
                <div className="text-sm sm:text-base text-contest-blue truncate">
                  Philippines
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Like"
              >
                <Heart className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Like</span>
                <span>{likes}</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Comments"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Comment</span>
                <span>{comments}</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Share</span>
              </button>
            </div>
          </div>
        </Card>

        <PhotoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          photos={allPhotos}
          currentIndex={modalStartIndex}
          contestantName={authorName}
          age={25}
          weight={52}
          height={168}
          country="Philippines"
          city="Unknown"
        />
      </>
    );
  }

  // For posts and photos, render in contest card style too
  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden flex h-32 sm:h-36 md:h-40">
        {/* Main two photos */}
        <div className="flex-shrink-0 flex h-full relative gap-px">
          <div className="relative">
            <img 
              src={imageSrc || contestant1Face} 
              alt={`${authorName} face`}
              className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openModal(0)}
            />
          </div>
          <div className="relative">
            <img 
              src={imageSrc || contestant1Full} 
              alt={`${authorName} full body`}
              className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openModal(1)}
            />
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex-1 p-1.5 sm:p-2 md:p-3 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 mr-2">
              {authorProfileId ? (
                <Link 
                  to={`/u/${authorProfileId}`}
                  className="font-semibold text-contest-text text-base sm:text-lg truncate hover:text-primary underline-offset-2 hover:underline"
                >
                  {authorName}, 25
                </Link>
              ) : (
                <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">{authorName}, 25</h3>
              )}
              <div className="text-xs sm:text-sm text-muted-foreground font-normal">52 kg · 168 cm</div>
              <div className="text-sm sm:text-base text-contest-blue truncate">
                Philippines
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Like"
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Like</span>
              <span>{likes}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Comments"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Comment</span>
              <span>{comments}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Share</span>
            </button>
          </div>
        </div>
      </Card>

      {imageSrc && (
        <PhotoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          photos={[imageSrc]}
          currentIndex={modalStartIndex}
          contestantName={authorName}
          age={25}
          weight={52}
          height={168}
          country="Philippines"
          city=""
        />
      )}
    </>
  );
};

export default LikedItem;