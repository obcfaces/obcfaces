import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface LikedItemProps {
  likeId: string;
  contentType: 'post' | 'photo' | 'contest';
  contentId: string;
  authorName: string;
  authorAvatarUrl?: string;
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
  time,
  content,
  imageSrc,
  likes = 0,
  comments = 0,
  onUnlike
}: LikedItemProps) => {
  const [isUnliking, setIsUnliking] = useState(false);

  const handleUnlike = async () => {
    setIsUnliking(true);
    try {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", likeId);
      
      if (error) throw error;
      
      onUnlike?.(likeId);
      toast({ description: "Лайк убран" });
    } catch (error) {
      toast({ description: "Не удалось убрать лайк" });
    } finally {
      setIsUnliking(false);
    }
  };

  return (
    <Card className="rounded-none sm:rounded-lg border bg-card">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={authorAvatarUrl ?? undefined} alt={`Avatar ${authorName}`} />
            <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium leading-none">{authorName}</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUnlike}
          disabled={isUnliking}
          className="text-destructive hover:text-destructive"
        >
          <Heart className="h-4 w-4 fill-current" />
        </Button>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-6">
        {content && <p className="text-sm whitespace-pre-line mb-3">{content}</p>}
        {imageSrc && (
          <img
            src={imageSrc}
            alt={`${contentType} image — ${authorName}`}
            loading="lazy"
            className="block w-full object-cover rounded-none sm:rounded-lg"
          />
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-6 text-sm text-muted-foreground">
        <span>👍 {likes}</span>
        <span>💬 {comments}</span>
        <span className="text-xs bg-muted px-2 py-1 rounded">
          {contentType === 'post' ? 'Пост' : contentType === 'photo' ? 'Фото' : 'Конкурс'}
        </span>
      </CardFooter>
    </Card>
  );
};

export default LikedItem;