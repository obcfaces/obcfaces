import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, ThumbsDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PhotoModal } from "@/components/photo-modal";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginModalContent from "@/components/login-modal-content";

// Import contest images for mock display
import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";

interface LikedItemProps {
  likeId: string;
  contentType: 'post' | 'photo' | 'contest' | 'next_week_candidate';
  contentId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorProfileId?: string;
  time: string;
  content?: string;
  imageSrc?: string;
  likes?: number;
  comments?: number;
  dislikes?: number;
  onUnlike?: (likeId: string) => void;
  viewMode?: 'compact' | 'full';
  candidateData?: any;
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
  dislikes = 0,
  onUnlike,
  viewMode = 'full',
  candidateData
}: LikedItemProps) => {
  const [isUnliking, setIsUnliking] = useState(false);
  const [isLiked, setIsLiked] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();

  // Get current user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleComment = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    openModal(0);
  };

  // Use candidate data if available, otherwise fallback to mock images
  const candidateAge = candidateData?.age || 25;
  const candidateWeight = candidateData?.weight || 52;
  const candidateHeight = candidateData?.height || 168;
  const candidateCountry = candidateData?.country || "Philippines";
  const candidateCity = candidateData?.city || "Unknown";
  const candidateFaceImage = candidateData?.faceImage || imageSrc;
  const candidateFullImage = candidateData?.fullBodyImage || imageSrc;
  const candidateAdditionalPhotos = candidateData?.additionalPhotos || [];
  
  // All cards use the exact same contest card structure
  const images = [contestant1Face, contestant2Face, contestant3Face];
  const fullImages = [contestant1Full, contestant2Full, contestant3Full];
  const randomIndex = Math.floor(Math.random() * images.length);
  
  // Use real candidate photos if available, otherwise use mock images
  const displayFaceImage = candidateFaceImage || images[randomIndex];
  const displayFullImage = candidateFullImage || fullImages[randomIndex];
  const allPhotos = [displayFaceImage, displayFullImage, ...candidateAdditionalPhotos].filter(Boolean);
  
  // Compact view (same as contest compact mode) 
  if (viewMode === 'compact') {
    return (
      <>
        <Card className="bg-card border-contest-border relative overflow-hidden flex h-32 sm:h-36 md:h-40">
          {/* Main two photos */}
          <div className="flex-shrink-0 flex h-full relative gap-px">
            <div className="relative">
              <img 
                src={displayFaceImage}
                alt={`${authorName} face`}
                className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(0)}
              />
            </div>
            <div className="relative">
              <img 
                src={displayFullImage} 
                alt={`${authorName} full body`}
                className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(1)}
              />
            </div>
          </div>
          
          {/* Content area - показываем информацию как в проголосованных карточках конкурса */}
          <div className="flex-1 p-1.5 sm:p-2 md:p-3 flex flex-col relative">
            <div className="absolute inset-0 bg-white rounded-r flex flex-col justify-between p-2 sm:p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 mr-2">
                  <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">
                    {authorProfileId ? (
                      <Link to={`/u/${authorProfileId}`} className="hover:text-primary underline-offset-2 hover:underline">
                        {authorName}
                      </Link>
                    ) : (
                      authorName
                    )}, {candidateAge}
                  </h3>
                  <div className="text-xs sm:text-sm text-muted-foreground font-normal">{candidateWeight} kg · {candidateHeight} cm</div>
                  <div className="text-sm sm:text-base text-contest-blue truncate">
                    {candidateCountry}
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0">
                  {/* Empty space like in contest cards */}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 text-xs sm:text-sm transition-colors",
                    "text-red-500 hover:text-red-600" // Always highlighted since it's a liked item
                  )}
                  onClick={handleUnlike}
                  disabled={isUnliking}
                  aria-label="Unlike"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden xl:inline">Like</span>
                  <span>{likes}</span>
                </button>
                {dislikes > 0 && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Dislikes"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Dislike</span>
                    <span>{dislikes}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleComment}
                  aria-label="Comments"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Comment</span>
                  <span>{comments}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={async () => {
                    try {
                      if ((navigator as any).share) {
                        await (navigator as any).share({ title: authorName, url: window.location.href });
                      } else if (navigator.clipboard) {
                        await navigator.clipboard.writeText(window.location.href);
                        toast({ title: "Link copied" });
                      }
                    } catch {}
                  }}
                  aria-label="Share"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Share</span>
                </button>
              </div>
            </div>
          </div>
        </Card>

        <PhotoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          photos={allPhotos}
          currentIndex={modalStartIndex}
          contestantName={authorName}
          age={candidateAge}
          weight={candidateWeight}
          height={candidateHeight}
          country={candidateCountry}
          city={candidateCity}
        />

        {/* Login Modal */}
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent className="sm:max-w-lg">
            <LoginModalContent onClose={() => setShowLoginModal(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  // Full view (same as contest full mode)
  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden">
        {/* Name in top left - показываем всегда как в проголосованных */}
        <div className="absolute top-2 left-4 z-20">
          <h3 className="text-xl font-semibold text-contest-text">
            {authorProfileId ? (
              <Link to={`/u/${authorProfileId}`} className="hover:text-primary underline-offset-2 hover:underline">
                {authorName}
              </Link>
            ) : (
              authorName
            )}, {candidateAge} <span className="text-sm text-muted-foreground font-normal">({candidateWeight} kg · {candidateHeight} cm)</span>
          </h3>
          <div className="text-contest-blue text-sm">{candidateCountry}</div>
        </div>
        
        {/* Header - пустой как в проголосованных карточках конкурса */}
        <div className="relative p-4 border-b border-contest-border h-[72px]">
          <div className="h-full"></div>
        </div>
        
        {/* Photos section */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-px">
            <div className="relative">
              <img 
                src={displayFaceImage} 
                alt={`${authorName} face`}
                className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(0)}
              />
            </div>
            <div className="relative">
              <img 
                src={displayFullImage} 
                alt={`${authorName} full body`}
                className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(1)}
              />
            </div>
          </div>
        </div>
        
        {/* Footer with actions - точно как в конкурсе */}
        <div className="border-t border-contest-border px-4 py-2 flex items-center justify-evenly gap-4">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 text-sm transition-colors",
              "text-red-500 hover:text-red-600" // Always highlighted since it's a liked item
            )}
            onClick={handleUnlike}
            disabled={isUnliking}
            aria-label="Unlike"
          >
            <Heart className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Like</span>
            <span>{likes}</span>
          </button>
          {dislikes > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dislikes"
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="hidden sm:inline">Dislike</span>
              <span>{dislikes}</span>
            </button>
          )}
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
                  await (navigator as any).share({ title: authorName, url: window.location.href });
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

      <PhotoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        photos={allPhotos}
        currentIndex={modalStartIndex}
        contestantName={authorName}
        age={candidateAge}
        weight={candidateWeight}
        height={candidateHeight}
        country={candidateCountry}
        city={candidateCity}
      />

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-lg">
          <LoginModalContent onClose={() => setShowLoginModal(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LikedItem;