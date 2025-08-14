import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface PostCardProps {
  id?: string;
  authorName: string;
  authorAvatarUrl?: string | null;
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

  return (
    <Card className="rounded-none sm:rounded-lg border bg-card">
      <CardHeader className="flex flex-row items-center gap-3 py-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={authorAvatarUrl ?? undefined} alt={`Avatar ${authorName}`} />
          <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <HoverCard>
            <HoverCardTrigger asChild>
              <button className="font-medium leading-none text-left hover:underline focus:outline-none">
                {authorName}
              </button>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={authorAvatarUrl ?? undefined} alt={`Avatar ${authorName}`} />
                  <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{authorName}</span>
                  <span className="text-xs text-muted-foreground">Last activity: {time}</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-6">
        <p className="text-sm whitespace-pre-line">{content}</p>
        {imageSrc && (
          <img
            src={imageSrc}
            alt={`Post image — ${authorName}`}
            loading="lazy"
            className="block w-full object-cover rounded-none sm:rounded-lg"
          />
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-6">
          <span>👍 {currentLikes}</span>
          <span>💬 {comments}</span>
        </div>
        {currentUserId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={loading}
            className={isLiked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PostCard;
