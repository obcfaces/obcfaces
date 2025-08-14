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
              <div className="absolute top-0 left-0 bg-black/70 text-white text-xs font-bold px-1 py-0.5 rounded-br">
                ❤️
              </div>
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
            <div>
              <div className="flex items-center justify-between mb-1">
                {authorProfileId ? (
                  <Link 
                    to={`/u/${authorProfileId}`}
                    className="font-semibold text-sm sm:text-base text-contest-text hover:text-primary hover:underline"
                  >
                    {authorName}
                  </Link>
                ) : (
                  <h3 className="font-semibold text-sm sm:text-base text-contest-text">{authorName}</h3>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUnlike}
                  disabled={isUnliking}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Heart className="h-3 w-3 fill-current" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mb-1">Philippines</div>
              <div className="text-xs text-muted-foreground">{time}</div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {comments}
                </span>
              </div>
              <span className="bg-contest-blue/10 text-contest-blue px-2 py-0.5 rounded text-xs">
                Конкурс
              </span>
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

  // For posts and photos, render in post style but more compact
  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-contest-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={authorAvatarUrl ?? undefined} alt={`Avatar ${authorName}`} />
              <AvatarFallback className="text-xs">{getInitials(authorName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              {authorProfileId ? (
                <Link 
                  to={`/u/${authorProfileId}`}
                  className="font-medium text-sm leading-none hover:text-primary hover:underline"
                >
                  {authorName}
                </Link>
              ) : (
                <span className="font-medium text-sm leading-none">{authorName}</span>
              )}
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnlike}
            disabled={isUnliking}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Heart className="h-4 w-4 fill-current" />
          </Button>
        </div>
        
        <div className="p-3">
          {content && <p className="text-sm whitespace-pre-line mb-3">{content}</p>}
          {imageSrc && (
            <img
              src={imageSrc}
              alt={`${contentType} image — ${authorName}`}
              loading="lazy"
              className="block w-full object-cover rounded-lg max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => openModal(0)}
            />
          )}
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {comments}
              </span>
            </div>
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {contentType === 'post' ? 'Пост' : 'Фото'}
            </span>
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
          weight={0}
          height={0}
          country=""
          city=""
        />
      )}
    </>
  );
};

export default LikedItem;