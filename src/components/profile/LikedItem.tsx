import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContestantCard } from "@/components/contest-card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { PhotoModal } from "@/components/photo-modal";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginModalContent from "@/components/login-modal-content";

// Use direct paths to public images

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
  likes: number;
  comments: number;
  participantType?: 'candidate' | 'finalist' | 'winner';
  candidateData?: {
    name: string;
    age: number;
    weight: number;
    height: number;
    country: string;
    city: string;
    faceImage: string;
    fullBodyImage: string;
    participantType: 'candidate' | 'finalist' | 'winner';
  };
  onUnlike?: (likeId: string) => void;
}

const LikedItem: React.FC<LikedItemProps> = ({
  likeId,
  contentType,
  contentId,
  authorName,
  authorAvatarUrl,
  authorProfileId,
  time,
  content,
  imageSrc,
  likes,
  comments,
  participantType,
  candidateData,
  onUnlike,
}) => {
  const [isLiked, setIsLiked] = useState(true);
  const [currentLikes, setCurrentLikes] = useState(likes);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };
    checkAuth();
  }, []);

  const handleLike = async () => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', likeId);

        if (error) throw error;

        setIsLiked(false);
        setCurrentLikes(prev => prev - 1);
        if (onUnlike) {
          onUnlike(likeId);
        }
        toast({
          description: "Removed from likes",
        });
      } else {
        // Like again
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              user_id: currentUser.id,
              content_type: contentType,
              content_id: contentId,
            }
          ]);

        if (error) throw error;

        setIsLiked(true);
        setCurrentLikes(prev => prev + 1);
        toast({
          description: "Added to likes",
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        variant: "destructive",
        description: "Failed to update like status",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${authorName}'s post`,
          text: content || `${authorName}'s post`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast({
        description: "Link copied to clipboard",
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', likeId);

      if (error) throw error;

      if (onUnlike) {
        onUnlike(likeId);
      }
      toast({
        description: "Removed from likes",
      });
    } catch (error) {
      console.error('Error deleting like:', error);
      toast({
        variant: "destructive",
        description: "Failed to remove like",
      });
    }
  };

  // Special rendering for contest participants
  if (contentType === 'contest' || contentType === 'next_week_candidate') {
    if (!candidateData) return null;

    return (
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={authorAvatarUrl} />
              <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {authorProfileId ? (
                <Link to={`/u/${authorProfileId}`}>
                  <h3 className="font-semibold text-card-foreground hover:underline">{authorName}</h3>
                </Link>
              ) : (
                <h3 className="font-semibold text-card-foreground">{authorName}</h3>
              )}
              <p className="text-sm text-muted-foreground">{time}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove from likes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mb-4">
            <p className="text-card-foreground mb-3">
              {contentType === 'contest' ? 'Участвует в конкурсе' : 'Кандидат на следующую неделю'}
            </p>
            <ContestantCard
              rank={0}
              name={candidateData.name}
              country={candidateData.country}
              city={candidateData.city}
              age={candidateData.age}
              weight={candidateData.weight}
              height={candidateData.height}
              rating={0}
              faceImage={candidateData.faceImage}
              fullBodyImage={candidateData.fullBodyImage}
              viewMode="compact"
              onRate={() => {}}
              hideRating={true}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2",
                  isLiked && "text-red-500"
                )}
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                {currentLikes}
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {comments}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent>
            <LoginModalContent onClose={() => setShowLoginModal(false)} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Handle other content types with mock data
  const mockImages = ["/lovable-uploads/1147be30-a1d2-466f-a9a8-067f4628cbb2.png", "/lovable-uploads/009d20f0-cac7-4c08-9bc9-146617664bc3.png", "/lovable-uploads/c4e9d90c-eeda-44db-94e3-08c6a959f1a5.png"];
  const mockFullImages = ["/lovable-uploads/1147be30-a1d2-466f-a9a8-067f4628cbb2.png", "/lovable-uploads/009d20f0-cac7-4c08-9bc9-146617664bc3.png", "/lovable-uploads/c4e9d90c-eeda-44db-94e3-08c6a959f1a5.png"];
  const randomIndex = Math.floor(Math.random() * mockImages.length);

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorAvatarUrl || mockImages[randomIndex]} />
            <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            {authorProfileId ? (
              <Link to={`/u/${authorProfileId}`}>
                <h3 className="font-semibold text-card-foreground hover:underline">{authorName}</h3>
              </Link>
            ) : (
              <h3 className="font-semibold text-card-foreground">{authorName}</h3>
            )}
            <p className="text-sm text-muted-foreground">{time}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove from likes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {content && (
          <p className="text-card-foreground mb-3">{content}</p>
        )}

        {imageSrc && (
          <div className="mb-4">
            <img
              src={imageSrc || mockFullImages[randomIndex]}
              alt="Post content"
              className="w-full rounded-lg cursor-pointer"
              onClick={() => setPhotoModalOpen(true)}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "flex items-center gap-2",
                isLiked && "text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              {currentLikes}
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {comments}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {photoModalOpen && imageSrc && (
        <PhotoModal
          isOpen={photoModalOpen}
          onClose={() => setPhotoModalOpen(false)}
          imageSrc={imageSrc}
          authorName={authorName}
        />
      )}
      
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <LoginModalContent onClose={() => setShowLoginModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LikedItem;