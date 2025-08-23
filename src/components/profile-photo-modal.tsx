import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, ChevronLeft, ChevronRight, ThumbsUp, MessageCircle, Send, Share2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import LoginModalContent from "@/components/login-modal-content";

interface Comment {
  id: string;
  author: string;
  authorId: string;
  text: string;
  timestamp: string;
}

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  currentIndex: number;
  profileId: string;
  profileName: string;
}

export function ProfilePhotoModal({ 
  isOpen, 
  onClose, 
  photos, 
  currentIndex, 
  profileId,
  profileName
}: ProfilePhotoModalProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [photoComments, setPhotoComments] = useState<Record<number, Comment[]>>({});
  const [photoLikes, setPhotoLikes] = useState<Record<number, { count: number; isLiked: boolean }>>({});
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { toast } = useToast();
  
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

  // Load comments and likes when modal opens or photo changes
  useEffect(() => {
    if (!isOpen) return;
    
    const loadPhotoData = async () => {
      console.log('Loading photo data for:', { activeIndex, photoUrl: photos[activeIndex], profileId });
      
      // Load all posts from this user to find which post contains this photo
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id, media_urls, created_at')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      console.log('User posts:', userPosts);

      // Find the post that contains the current photo - more precise matching
      let matchingPostId = null;
      const currentPhotoUrl = photos[activeIndex];
      
      if (userPosts) {
        for (const post of userPosts) {
          if (post.media_urls && Array.isArray(post.media_urls)) {
            // Check if this specific photo URL exists in this post's media URLs
            const foundInPost = post.media_urls.some(url => {
              // More flexible URL matching - handle different URL formats
              const normalizedPostUrl = url.trim();
              const normalizedCurrentUrl = currentPhotoUrl.trim();
              return normalizedPostUrl === normalizedCurrentUrl || 
                     normalizedPostUrl.endsWith(normalizedCurrentUrl.split('/').pop()) ||
                     normalizedCurrentUrl.endsWith(normalizedPostUrl.split('/').pop());
            });
            
            if (foundInPost) {
              matchingPostId = post.id;
              console.log('Found matching post:', { postId: post.id, photoUrl: currentPhotoUrl, postMediaUrls: post.media_urls });
              break;
            }
          }
        }
      }

      console.log('Matching post ID:', matchingPostId);

      if (matchingPostId) {
        // Load comments for the specific post
        const { data: comments } = await supabase
          .from('photo_comments')
          .select('*')
          .eq('content_type', 'post')
          .eq('content_id', matchingPostId)
          .order('created_at', { ascending: false });

        console.log('Comments for post:', { postId: matchingPostId, comments });

        if (comments) {
          // Get user profiles separately
          const userIds = [...new Set(comments.map(c => c.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds);

          const formattedComments: Comment[] = comments.map(comment => {
            const profile = profiles?.find(p => p.id === comment.user_id);
            return {
              id: comment.id,
              author: profile?.display_name || 'User',
              authorId: comment.user_id,
              text: comment.comment_text,
              timestamp: new Date(comment.created_at).toLocaleString()
            };
          });
          
          console.log('Setting comments for activeIndex:', { activeIndex, comments: formattedComments });
          
          setPhotoComments(prev => ({
            ...prev,
            [activeIndex]: formattedComments
          }));
        }

        // Load likes for the post
        const { data: totalLikes } = await supabase
          .from("post_likes")
          .select("user_id")
          .eq("post_id", matchingPostId);
        
        const { data: userLike } = await supabase
          .from("post_likes")
          .select("id")
          .eq("user_id", user?.id || '')
          .eq("post_id", matchingPostId)
          .maybeSingle();
        
        setPhotoLikes(prev => ({
          ...prev,
          [activeIndex]: {
            count: totalLikes?.length || 0,
            isLiked: !!userLike
          }
        }));
      } else {
        console.log('No matching post found, setting empty state for activeIndex:', activeIndex);
        // If no matching post found, show empty state
        setPhotoComments(prev => ({
          ...prev,
          [activeIndex]: []
        }));
        setPhotoLikes(prev => ({
          ...prev,
          [activeIndex]: { count: 0, isLiked: false }
        }));
      }
    };

    loadPhotoData();
  }, [isOpen, activeIndex, profileId, user, photos]);

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

  const handleLike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // Find the post that contains this photo using improved matching logic
    const { data: userPosts } = await supabase
      .from('posts')
      .select('id, media_urls')
      .eq('user_id', profileId);

    let matchingPostId = null;
    const currentPhotoUrl = photos[activeIndex];
    
    if (userPosts) {
      for (const post of userPosts) {
        if (post.media_urls && Array.isArray(post.media_urls)) {
          const foundInPost = post.media_urls.some(url => {
            const normalizedPostUrl = url.trim();
            const normalizedCurrentUrl = currentPhotoUrl.trim();
            return normalizedPostUrl === normalizedCurrentUrl || 
                   normalizedPostUrl.endsWith(normalizedCurrentUrl.split('/').pop()) ||
                   normalizedCurrentUrl.endsWith(normalizedPostUrl.split('/').pop());
          });
          
          if (foundInPost) {
            matchingPostId = post.id;
            break;
          }
        }
      }
    }

    if (!matchingPostId) return;
    
    const wasLiked = photoLikes[activeIndex]?.isLiked || false;
    
    // Optimistic update first
    setPhotoLikes(prev => ({
      ...prev,
      [activeIndex]: {
        count: wasLiked ? (prev[activeIndex]?.count || 0) - 1 : (prev[activeIndex]?.count || 0) + 1,
        isLiked: !wasLiked
      }
    }));
    
    try {
      if (wasLiked) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", matchingPostId);
      } else {
        // Like
        await supabase
          .from("post_likes")
          .insert({
            user_id: user.id,
            post_id: matchingPostId,
          });
      }
      
    } catch (error) {
      console.error('Error handling like:', error);
      // Revert optimistic update on error
      setPhotoLikes(prev => ({
        ...prev,
        [activeIndex]: {
          count: wasLiked ? (prev[activeIndex]?.count || 0) + 1 : (prev[activeIndex]?.count || 0) - 1,
          isLiked: wasLiked
        }
      }));
    }
  };

  const handleCommentSubmit = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    if (commentText.trim()) {
      // Find the post that contains this photo using improved matching logic
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id, media_urls')
        .eq('user_id', profileId);

      let matchingPostId = null;
      const currentPhotoUrl = photos[activeIndex];
      
      if (userPosts) {
        for (const post of userPosts) {
          if (post.media_urls && Array.isArray(post.media_urls)) {
            const foundInPost = post.media_urls.some(url => {
              const normalizedPostUrl = url.trim();
              const normalizedCurrentUrl = currentPhotoUrl.trim();
              return normalizedPostUrl === normalizedCurrentUrl || 
                     normalizedPostUrl.endsWith(normalizedCurrentUrl.split('/').pop()) ||
                     normalizedCurrentUrl.endsWith(normalizedPostUrl.split('/').pop());
            });
            
            if (foundInPost) {
              matchingPostId = post.id;
              break;
            }
          }
        }
      }

      if (!matchingPostId) {
        toast({
          title: "Ошибка",
          description: "Не удалось найти пост с этим фото",
          duration: 3000,
        });
        return;
      }
      
      try {
        // Save comment to database
        const { error } = await supabase
          .from('photo_comments')
          .insert({
            user_id: user.id,
            content_type: 'post',
            content_id: matchingPostId,
            comment_text: commentText.trim()
          });

        if (error) {
          console.error('Error saving comment:', error);
          toast({
            title: "Ошибка",
            description: "Не удалось сохранить комментарий",
            duration: 3000,
          });
          return;
        }

        // Add comment to local state for immediate feedback
        const newComment: Comment = {
          id: `temp-${Date.now()}`,
          author: "Вы",
          authorId: user.id,
          text: commentText.trim(),
          timestamp: "только что"
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
        
        // Reload comments to get fresh data from database
        setTimeout(() => {
          const loadCommentsAgain = async () => {
            const { data: freshComments } = await supabase
              .from('photo_comments')
              .select('*')
              .eq('content_type', 'post')
              .eq('content_id', matchingPostId)
              .order('created_at', { ascending: false });
            
            if (freshComments) {
              const userIds = [...new Set(freshComments.map(c => c.user_id))];
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', userIds);

              const formattedComments: Comment[] = freshComments.map(comment => {
                const profile = profiles?.find(p => p.id === comment.user_id);
                return {
                  id: comment.id,
                  author: profile?.display_name || 'User',
                  authorId: comment.user_id,
                  text: comment.comment_text,
                  timestamp: new Date(comment.created_at).toLocaleString()
                };
              });
              
              setPhotoComments(prev => ({
                ...prev,
                [activeIndex]: formattedComments
              }));
            }
          };
          loadCommentsAgain();
        }, 500);
        
        toast({
          title: "Комментарий добавлен",
          description: "Ваш комментарий был добавлен",
          duration: 1000,
        });
      } catch (error) {
        console.error('Error saving comment:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось сохранить комментарий",
          duration: 3000,
        });
      }
    }
  };

  const focusCommentInput = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    textareaRef.current?.focus();
    if (commentsListRef.current) {
      commentsListRef.current.scrollTo({
        top: commentsListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/u/${profileId}`;
    const shareTitle = `Фото ${profileName}`;
    const shareDescription = `Посмотрите фото ${profileName}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка была скопирована в буфер обмена",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
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
      nextPhoto();
    } else if (distance < -minSwipeDistance) {
      prevPhoto();
    }
  };

  const currentPhotoComments = photoComments[activeIndex] || [];
  const currentPhotoLikes = photoLikes[activeIndex] || { count: 0, isLiked: false };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-[60] w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </button>

          {/* Photo container */}
          <div className="relative h-full w-full flex items-center justify-center"
               onTouchStart={onTouchStart}
               onTouchMove={onTouchMove}
               onTouchEnd={onTouchEnd}>
            
            <img
              src={photos[activeIndex]}
              alt={`${profileName} photo ${activeIndex + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />

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

            {photos.length > 1 && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
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

            {/* Info overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-white max-h-[50vh] flex flex-col">
              {/* Header with name and icons */}
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-black">
                      {profileName}
                    </h3>
                    <div className="text-sm text-gray-600">
                      Фото {activeIndex + 1} из {photos.length}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-2 text-sm",
                        currentPhotoLikes.isLiked ? "text-blue-600" : "text-gray-600"
                      )}
                      onClick={handleLike}
                    >
                       <ThumbsUp className={cn(
                         "w-5 h-5",
                         photoLikes[activeIndex]?.isLiked && "fill-blue-500 text-blue-500"
                       )} strokeWidth={1} />
                      <span>{currentPhotoLikes.count}</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-gray-600"
                      onClick={focusCommentInput}
                    >
                      <MessageCircle className="w-5 h-5" strokeWidth={1} />
                      <span>{currentPhotoComments.length}</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-gray-600"
                      onClick={handleShare}
                    >
                      <Share2 className="w-5 h-5" strokeWidth={1} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Comments section */}
              <div className="flex-1 overflow-y-auto min-h-0 px-4" ref={commentsListRef}>
                <div className="space-y-3 py-3">
                  {currentPhotoComments.map((comment) => (
                    <div key={comment.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/u/${comment.authorId}`} 
                          className="font-medium text-sm hover:text-primary underline-offset-2 hover:underline"
                        >
                          {comment.author}
                        </Link>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-800">{comment.text}</p>
                    </div>
                  ))}
                  {currentPhotoComments.length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      Пока нет комментариев. Будьте первым!
                    </p>
                  )}
                </div>
              </div>

              {/* Comment input */}
              <div className="border-t p-4 flex-shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment for this photo..."
                    className="flex-1 resize-none min-h-[44px] max-h-[44px] text-sm overflow-hidden"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCommentSubmit();
                      }
                    }}
                  />
                  <Button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim()}
                    size="icon"
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="w-full max-w-md">
          <LoginModalContent 
            onClose={() => setShowLoginModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}