import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

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
    <Card className="rounded-none sm:rounded-lg border bg-card">
      <CardHeader className="flex flex-row items-center gap-3 py-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={authorAvatarUrl ?? undefined} alt={`Аватар ${authorName}`} />
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
                  <AvatarImage src={authorAvatarUrl ?? undefined} alt={`Аватар ${authorName}`} />
                  <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{authorName}</span>
                  <span className="text-xs text-muted-foreground">Последняя активность: {time}</span>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pt-0 pb-6">
        <p className="text-sm whitespace-pre-line mb-4">{content}</p>
        {imageSrc && (
          <img
            src={imageSrc}
            alt={`Изображение из поста — ${authorName}`}
            loading="lazy"
            className="block w-full object-cover rounded-none sm:rounded-lg mt-4"
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
