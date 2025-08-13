import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import LoginModalTrigger from "@/components/login-modal";

interface Comment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex: number;
  contestantName: string;
  age?: number;
  weight?: number;
  height?: number;
  country?: string;
  city?: string;
}

export function PhotoModal({ isOpen, onClose, photos, currentIndex, contestantName, age, weight, height, country, city }: PhotoModalProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  // Comments are always shown now
  const [commentText, setCommentText] = useState("");
  const [photoComments, setPhotoComments] = useState<Record<number, Comment[]>>({
    0: [
      { id: 1, author: "Maria_K", text: "Stunning portrait! Beautiful eyes.", timestamp: "1 hour ago" },
      { id: 2, author: "Alex92", text: "Professional shot, great angle.", timestamp: "3 hours ago" },
    ],
    1: [
      { id: 3, author: "Svetlana", text: "Perfect shape! 👍", timestamp: "2 hours ago" },
      { id: 4, author: "Michael_Fit", text: "You work hard on yourself, respect!", timestamp: "3 hours ago" },
    ],
    2: [
      { id: 5, author: "VictoriaStyle", text: "Love this photo! Very pretty.", timestamp: "1 hour ago" },
      { id: 6, author: "AndrewArt", text: "Excellent photo! Professional work.", timestamp: "2 hours ago" },
    ],
  });
  const [photoLikes, setPhotoLikes] = useState<Record<number, { count: number; isLiked: boolean }>>({
    0: { count: 23, isLiked: false },
    1: { count: 18, isLiked: false },
    2: { count: 15, isLiked: false }
  });
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();

  // Refs for focusing comment input and scrolling
  const commentsListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Reset activeIndex when currentIndex changes
  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  const nextPhoto = () => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleLike = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    setPhotoLikes(prev => ({
      ...prev,
      [activeIndex]: {
        count: prev[activeIndex]?.isLiked ? (prev[activeIndex]?.count || 0) - 1 : (prev[activeIndex]?.count || 0) + 1,
        isLiked: !prev[activeIndex]?.isLiked
      }
    }));
  };

  const handleCommentSubmit = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Date.now(),
        author: "You",
        text: commentText.trim(),
        timestamp: "just now"
      };
      setPhotoComments(prev => ({
        ...prev,
        [activeIndex]: [newComment, ...(prev[activeIndex] || [])]
      }));
      setCommentText("");
      // Reset textarea height back to one line after submit
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
      toast({
        title: "Comment added",
        description: "Your comment was added",
      });
    }
  };

  const focusCommentInput = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    textareaRef.current?.focus();
    // Ensure comments panel is scrolled to the latest position
    if (commentsListRef.current) {
      commentsListRef.current.scrollTo({
        top: commentsListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };


  // Touch handlers for swipe functionality
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swipe left - next photo
      nextPhoto();
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous photo  
      prevPhoto();
    }
  };

  const currentPhotoComments = photoComments[activeIndex] || [];
  const currentPhotoLikes = photoLikes[activeIndex] || { count: Math.floor(Math.random() * 30) + 5, isLiked: false };

  // Ensure all photos have like data
  if (!photoLikes[activeIndex]) {
    setPhotoLikes(prev => ({
      ...prev,
      [activeIndex]: { count: Math.floor(Math.random() * 30) + 5, isLiked: false }
    }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 left-0 top-0 translate-x-0 translate-y-0 w-screen max-w-none h-dvh overflow-hidden p-0 bg-black/90">
        {/* Desktop: flex layout, Mobile: block layout */}
        <div className="h-full flex flex-col">
          {/* Photo section */}
          <div className={cn(
            "relative flex items-start justify-center transition-all duration-300 pt-2 md:pt-4",
            "w-full h-[60dvh]"
          )}>

          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-white/90 transition-colors w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-white/90 transition-colors w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center"
                aria-label="Next photo"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          <img
            src={photos[activeIndex]}
            alt={`${contestantName} photo ${activeIndex + 1}`}
            className="w-full max-w-full max-h-full object-contain self-start"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />

          {/* actions moved to header */}


          {photos.length > 1 && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {photos.map((src, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Go to photo ${index + 1}`}
                  className={cn(
                    "relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-1 ring-white/40 border border-white/20 transition-all",
                    index === activeIndex ? "ring-2 ring-white opacity-100" : "opacity-70 hover:opacity-100"
                  )}
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comments section - Desktop: sidebar, Mobile: bottom panel */}
        <div className={cn(
          "bg-background relative flex flex-col",
          "h-[40dvh]"
        )}>
            <div className="p-4 border-b">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-contest-text truncate">
                    {contestantName}
                    {age ? `, ${age}` : ""}
                    {(weight || height) ? (
                      <span className="ml-1 text-xs sm:text-sm text-muted-foreground font-normal">
                        (
                        {weight ? `${weight} kg` : ""}
                        {(weight && height) ? " · " : ""}
                        {height ? `${height} cm` : ""}
                        )
                      </span>
                    ) : null}
                  </h3>
                  <div className="text-sm text-contest-blue truncate">
                    {(country || "")}
                    {(country && city) ? " · " : ""}
                    {(city || "")}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(currentPhotoLikes.isLiked && "text-red-400")}
                    onClick={handleLike}
                    aria-label="Like"
                  >
                    <Heart className={cn("w-4 h-4 mr-1", currentPhotoLikes.isLiked && "fill-current")} />
                    {currentPhotoLikes.count}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={focusCommentInput}
                    aria-label="Open comment field"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {currentPhotoComments.length}
                  </Button>
                </div>
              </div>
            </div>

            <div ref={commentsListRef} className="flex-1 overflow-y-auto p-4 pb-24 md:pb-28 space-y-3 min-h-0">
              {currentPhotoComments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">
                  No comments yet for this photo
                </p>
              ) : (
                currentPhotoComments.map((comment) => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm">{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="sticky bottom-0 left-0 right-0 p-3 md:p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)] flex items-end gap-2 md:gap-3">
              <Textarea
                ref={textareaRef}
                placeholder="Write a comment for this photo..."
                value={commentText}
                rows={1}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  const maxH = Math.floor(window.innerHeight * 0.3);
                  el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCommentSubmit();
                  }
                }}
                className="flex-1 resize-none overflow-y-auto text-base md:text-sm min-h-[44px] max-h-[30dvh]"
                aria-label="Comment for current photo"
              />
              <Button
                onClick={handleCommentSubmit}
                disabled={!commentText.trim()}
                size="icon"
                className="shrink-0 rounded-full h-10 w-10 bg-contest-blue text-white hover:bg-contest-blue/90"
                aria-label="Send comment"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Login Modal */}
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent className="sm:max-w-lg">
            <LoginModalTrigger />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}