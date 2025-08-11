import { useState, useEffect, useRef } from "react";
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
      },
      {
        id: 3,
        author: "Елена_Мир",
        text: "Вау! Такая естественная красота! 😍",
        timestamp: "4 часа назад"
      },
      {
        id: 4,
        author: "ДмитрийФото",
        text: "Отличная работа фотографа, свет идеально подобран",
        timestamp: "5 часов назад"
      },
      {
        id: 5,
        author: "Анна2024",
        text: "Просто восхитительно! Очень стильный образ",
        timestamp: "6 часов назад"
      },
      {
        id: 6,
        author: "Максим_В",
        text: "Профессиональный уровень съемки 👏",
        timestamp: "7 часов назад"
      },
      {
        id: 7,
        author: "Катя_style",
        text: "Невероятно красивые глаза! Завораживает",
        timestamp: "8 часов назад"
      },
      {
        id: 8,
        author: "ИгорьФотограф",
        text: "Отличная композиция и постобработка",
        timestamp: "9 часов назад"
      },
      {
        id: 9,
        author: "Лиза_модель",
        text: "Какая же ты красивая! Вдохновляешь ✨",
        timestamp: "10 часов назад"
      },
      {
        id: 10,
        author: "ВладимирАрт",
        text: "Фото достойно журнальной обложки!",
        timestamp: "11 часов назад"
      },
      {
        id: 11,
        author: "София_beauty",
        text: "Обожаю такие естественные фото без фильтров",
        timestamp: "12 часов назад"
      },
      {
        id: 12,
        author: "АртемСтиль",
        text: "Прекрасное сочетание света и тени",
        timestamp: "13 часов назад"
      }
    ],
    1: [
      {
        id: 13,
        author: "Светлана",
        text: "Идеальная фигура! 👍",
        timestamp: "2 часа назад"
      },
      {
        id: 14,
        author: "Михаил_спорт",
        text: "Видно что много работаешь над собой! Респект",
        timestamp: "3 часа назад"
      },
      {
        id: 15,
        author: "Кристина_фитнес",
        text: "Какая же ты стройная! Поделись секретом 💪",
        timestamp: "4 часа назад"
      },
      {
        id: 16,
        author: "ОлегТренер",
        text: "Отличная физическая форма! Мотивируешь",
        timestamp: "5 часов назад"
      },
      {
        id: 17,
        author: "Наташа_здоровье",
        text: "Прекрасная фигура! Явно занимаешься спортом",
        timestamp: "6 часов назад"
      },
      {
        id: 18,
        author: "ДенисСпорт",
        text: "Вдохновляющий пример! Так держать 🔥",
        timestamp: "7 часов назад"
      },
      {
        id: 19,
        author: "Алина_йога",
        text: "Гармония и красота в одном фото ✨",
        timestamp: "8 часов назад"
      },
      {
        id: 20,
        author: "РоманФит",
        text: "Результат тяжелой работы над собой!",
        timestamp: "9 часов назад"
      }
    ],
    2: [
      {
        id: 21,
        author: "ВикторияСтиль",
        text: "Обожаю такие фото! Очень красиво",
        timestamp: "1 час назад"
      },
      {
        id: 22,
        author: "АндрейАрт",
        text: "Отличное фото! Профессиональная работа",
        timestamp: "2 часа назад"
      },
      {
        id: 23,
        author: "Юлия_модница",
        text: "Какой стильный образ! Где такой наряд?",
        timestamp: "3 часа назад"
      },
      {
        id: 24,
        author: "СергейДизайн",
        text: "Фото как произведение искусства 🎨",
        timestamp: "4 часа назад"
      },
      {
        id: 25,
        author: "Маша_creative",
        text: "Невероятная атмосфера на фото!",
        timestamp: "5 часов назад"
      }
    ]
  });
  const [photoLikes, setPhotoLikes] = useState<Record<number, { count: number; isLiked: boolean }>>({
    0: { count: 23, isLiked: false },
    1: { count: 18, isLiked: false },
    2: { count: 15, isLiked: false }
  });
  const { toast } = useToast();

  // Refs for focusing comment input and scrolling
  const commentsListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const focusCommentInput = () => {
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
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:text-white/90 transition-colors w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur flex items-center justify-center"
                aria-label="Следующее фото"
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

        {/* Comments section - Desktop: sidebar, Mobile: bottom panel */}
        <div className={cn(
          "bg-background relative flex flex-col",
          "h-[40dvh]"
        )}>
            <div className="p-4 border-b">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {contestantName}
                    {age ? ` · ${age}` : ""}
                    {weight ? ` · ${weight} кг` : ""}
                    {height ? ` · ${height} см` : ""}
                  </div>
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
                    aria-label="Нравится"
                  >
                    <Heart className={cn("w-4 h-4 mr-1", currentPhotoLikes.isLiked && "fill-current")} />
                    {currentPhotoLikes.count}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={focusCommentInput}
                    aria-label="Открыть поле комментария"
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

            <div className="sticky bottom-0 left-0 right-0 p-3 md:p-4 border-t space-y-2 md:space-y-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
              <Textarea
                ref={textareaRef}
                placeholder="Напишите комментарий к этой фотографии..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-[50px] md:min-h-[60px] resize-none text-base md:text-sm"
                aria-label="Комментарий к текущей фотографии"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}