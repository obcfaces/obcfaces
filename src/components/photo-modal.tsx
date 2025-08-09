import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
}

export function PhotoModal({ isOpen, onClose, photos, currentIndex, contestantName }: PhotoModalProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [photoComments, setPhotoComments] = useState<Record<number, Comment[]>>({
    // Примеры комментариев для первой фотографии первого участника
    0: [
      {
        id: 1,
        author: "Мария_К",
        text: "Потрясающий портрет! Очень красивые глаза",
        timestamp: "1 час назад"
      },
      {
        id: 2,
        author: "Alex92",
        text: "Профессиональное фото, отличный ракурс",
        timestamp: "3 часа назад"
      }
    ],
    1: [
      {
        id: 3,
        author: "Светлана",
        text: "Идеальная фигура! 👍",
        timestamp: "2 часа назад"
      }
    ]
  });
  const [photoLikes, setPhotoLikes] = useState<Record<number, { count: number; isLiked: boolean }>>({
    0: { count: 23, isLiked: false },
    1: { count: 18, isLiked: false },
    2: { count: 15, isLiked: false }
  });
  const { toast } = useToast();

  // Reset activeIndex when currentIndex changes
  useEffect(() => {
    setActiveIndex(currentIndex);
    setShowComments(false);
  }, [currentIndex]);

  const nextPhoto = () => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleLike = () => {
    setPhotoLikes(prev => ({
      ...prev,
      [activeIndex]: {
        count: prev[activeIndex]?.isLiked ? (prev[activeIndex]?.count || 0) - 1 : (prev[activeIndex]?.count || 0) + 1,
        isLiked: !prev[activeIndex]?.isLiked
      }
    }));
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      const newComment: Comment = {
        id: Date.now(),
        author: "Вы",
        text: commentText.trim(),
        timestamp: "только что"
      };
      setPhotoComments(prev => ({
        ...prev,
        [activeIndex]: [newComment, ...(prev[activeIndex] || [])]
      }));
      setCommentText("");
      toast({
        title: "Комментарий добавлен",
        description: "Ваш комментарий к фотографии добавлен",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-black/90 flex">
        {/* Photo section */}
        <div className={cn(
          "relative flex items-center justify-center transition-all duration-300",
          showComments ? "w-2/3" : "w-full"
        )}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-4 z-10 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={nextPhoto}
                className={cn(
                  "absolute z-10 text-white hover:text-gray-300 transition-colors",
                  showComments ? "right-4" : "right-4"
                )}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <img
            src={photos[activeIndex]}
            alt={`${contestantName} photo ${activeIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />

          {/* Photo action buttons */}
          <div className="absolute bottom-16 left-4 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                "bg-black/50 hover:bg-black/70 text-white border-none",
                currentPhotoLikes.isLiked && "text-red-400"
              )}
              onClick={handleLike}
            >
              <Heart className={cn("w-4 h-4 mr-1", currentPhotoLikes.isLiked && "fill-current")} />
              {currentPhotoLikes.count}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-black/50 hover:bg-black/70 text-white border-none"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {currentPhotoComments.length}
            </Button>
          </div>

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
            {activeIndex + 1} / {photos.length}
          </div>

          {photos.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-1">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === activeIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="w-1/3 bg-white flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Комментарии</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {contestantName} - Фото {activeIndex + 1}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentPhotoComments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">
                  Пока нет комментариев к этой фотографии
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

            <div className="p-4 border-t space-y-3">
              <Textarea
                placeholder="Напишите комментарий к этой фотографии..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              <Button
                onClick={handleCommentSubmit}
                disabled={!commentText.trim()}
                className="w-full"
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Отправить
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}