import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface PostCardProps {
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
  authorName,
  authorAvatarUrl,
  time,
  content,
  imageSrc,
  likes = 0,
  comments = 0,
}: PostCardProps) => {
  return (
    <Card className="border bg-card">
      <CardHeader className="flex flex-row items-center gap-3 py-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={authorAvatarUrl ?? undefined} alt={`Аватар ${authorName}`} />
          <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium leading-none">{authorName}</span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-line">{content}</p>
        {imageSrc && (
          <img
            src={imageSrc}
            alt={`Изображение из поста — ${authorName}`}
            loading="lazy"
            className="w-full rounded-lg object-cover"
          />
        )}
      </CardContent>
      <CardFooter className="flex items-center gap-6 text-sm text-muted-foreground">
        <span>👍 {likes}</span>
        <span>💬 {comments}</span>
      </CardFooter>
    </Card>
  );
};

export default PostCard;
