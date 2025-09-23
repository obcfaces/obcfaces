import { ThumbsUp, MessageCircle, Share2, ThumbsDown, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn, getCountryDisplayName } from "@/lib/utils";
import { VotingOverlay } from "./VotingOverlay";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FullCardLayoutProps {
  // Basic info
  name: string;
  age: number;
  weight: number;
  height: number;
  country: string;
  city: string;
  profileId?: string;
  
  // Images
  faceImage: string;
  fullBodyImage: string;
  additionalPhotos: string[];
  
  // States
  isVoted: boolean;
  isEditing: boolean;
  showThanks: boolean;
  isExample: boolean;
  isThisWeek: boolean;
  isWinner: boolean;
  rank: number;
  userRating: number;
  
  // Rating display
  localAverageRating: number;
  isPopoverOpen: boolean;
  setIsPopoverOpen: (open: boolean) => void;
  
  // Card data
  cardData: any;
  isLiked: boolean[];
  hasCommented: boolean;
  isDisliked: boolean;
  dislikesCount: number;
  showDislike: boolean;
  
  // User
  propUser: any;
  
  // Handlers
  openModal: (index: number) => void;
  handleLike: (photoIndex: number) => void;
  handleComment: () => void;
  handleDislike: () => void;
  openShareModal: (data: any) => void;
  handleRate: (rating: number) => void;
  setShowLoginModal: (show: boolean) => void;
  setUserRating: (rating: number) => void;
  setIsEditing: (editing: boolean) => void;
}

export function FullCardLayout({
  name,
  age,
  weight,
  height,
  country,
  city,
  profileId,
  faceImage,
  fullBodyImage,
  additionalPhotos,
  isVoted,
  isEditing,
  showThanks,
  isExample,
  isThisWeek,
  isWinner,
  rank,
  userRating,
  localAverageRating,
  isPopoverOpen,
  setIsPopoverOpen,
  cardData,
  isLiked,
  hasCommented,
  isDisliked,
  dislikesCount,
  showDislike,
  propUser,
  openModal,
  handleLike,
  handleComment,
  handleDislike,
  openShareModal,
  handleRate,
  setShowLoginModal,
  setUserRating,
  setIsEditing
}: FullCardLayoutProps) {
  return (
    <>
      {/* Winner header */}
      {isWinner && (
        <div className="absolute top-0 left-0 w-[193px] sm:w-[225px] md:w-[257px] bg-blue-100 text-blue-700 pl-2 pr-2 py-1 text-xs font-semibold flex items-center justify-start z-20">
          <span>🏆 WINNER   + 5000 PHP</span>
        </div>
      )}
      
      {/* Rating badge in top right corner - show for everyone in past weeks */}
      {!isEditing && !showThanks && !isExample && (!isThisWeek || isVoted) && (
        <div className="absolute top-0 right-0 z-10 flex flex-col items-end">
           <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
             <PopoverTrigger asChild>
                <div className="bg-contest-blue text-white px-1.5 py-1 rounded-bl-lg text-sm sm:text-base font-bold shadow-sm cursor-pointer hover:bg-contest-blue/90 transition-colors relative">
                   {isWinner && (
                     <Crown className="w-4 h-4 text-yellow-400 absolute -top-5 left-1/2 transform -translate-x-1/2" />
                   )}
                    {(() => {
                      // Для всех пользователей (включая админов) показываем средний рейтинг
                      return localAverageRating > 0 ? localAverageRating.toFixed(1) : '0.0';
                    })()}
                </div>
             </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <div className="text-sm">
                  {userRating > 0 ? 
                    `Your rating: ${userRating}` : 
                    `No rating`
                  }{isThisWeek && ` — `}<button 
                    className={`text-contest-blue hover:underline ${!isThisWeek ? 'hidden' : ''}`}
                    onClick={() => {
                      setIsEditing(true);
                      setIsPopoverOpen(false);
                    }}
                  >
                    change
                  </button>
                </div>
              </PopoverContent>
           </Popover>
        </div>
      )}
      
      {/* Photos row */}
      <div className="flex h-36 sm:h-40 md:h-44 gap-px">
        <div className="relative">
          <img 
            src={faceImage} 
            alt={`${name} face`}
            className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openModal(0)}
          />
          {!isExample && (!isThisWeek || isVoted) && (
            <div className="absolute top-0 left-0 bg-black/70 text-white text-xs font-bold px-1 py-0.5 rounded-br">
              {rank > 0 ? rank : '★'}
            </div>
          )}
        </div>
        <div className="relative">
          <img 
            src={fullBodyImage} 
            alt={`${name} full body`}
            className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openModal(1)}
          />
          {(additionalPhotos.length > 0 || isWinner) && (
            <div 
              className="absolute bottom-0.5 right-0.5 bg-black/40 text-white/80 text-xs px-1 py-0.5 rounded cursor-pointer hover:bg-black/60 transition-colors"
              onClick={() => openModal(2)}
            >
              +{additionalPhotos.length + (isWinner ? 2 : 0)}
            </div>
          )}
        </div>
        
        {/* Content area - same as regular cards */}
        <div className={`flex-1 p-1 sm:p-2 md:p-3 flex flex-col relative`}>
          <VotingOverlay
            isThisWeek={isThisWeek}
            isVoted={isVoted}
            isEditing={isEditing}
            showThanks={showThanks}
            isExample={isExample}
            propUser={propUser}
            userRating={userRating}
            setShowLoginModal={setShowLoginModal}
            setUserRating={setUserRating}
            setIsEditing={setIsEditing}
            handleRate={handleRate}
            name={name}
            compact={false}
          />
          
          {/* Contestant info - shown for all users in past weeks or after voting in current week */}
          {(!isThisWeek || isVoted) && !isEditing && !showThanks && (
            <div className={`absolute inset-0 rounded-r flex flex-col justify-between p-1 sm:p-2 md:p-3 bg-white`}>
              {isExample ? (
                // For example cards, show only requirements block
                <div className="absolute inset-0 bg-yellow-50 border-2 border-yellow-300 rounded-lg flex items-start justify-start z-10 pt-2 pl-2">
                  <div className="text-left text-gray-800">
                    <h4 className="font-bold text-sm mb-1">How your photos should look:</h4>
                    <div className="text-xs space-y-0.5">
                      <div>• No makeup</div>
                      <div>• No filter</div>
                      <div>• No photo editing</div>
                      <div>• No glasses</div>
                      <div>• Tight-fitting clothes</div>
                    </div>
                  </div>
                </div>
              ) : (
                // For regular cards, show contestant info
                <>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1 mr-2">
                       <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">{profileId ? (<Link to={`/u/${profileId}`} className="hover:text-primary underline-offset-2 hover:underline">{name}</Link>) : name}</h3>
                       <div className="text-xs sm:text-sm text-muted-foreground font-normal">{age} yo · {weight} kg · {height} cm</div>
                       <div className="text-sm sm:text-base text-contest-blue truncate">
                         {getCountryDisplayName(country)} · {city}
                       </div>
                     </div>
                    
                    <div className="text-right flex-shrink-0">
                    </div>
                  </div>
                  
                  {!(isThisWeek && !isVoted) && (
                    <div className="flex items-center justify-end gap-2 sm:gap-4">
                       <button
                         type="button"
                         className={cn(
                           "inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors",
                           (isLiked[0] || isLiked[1]) && "text-contest-blue"
                         )}
                         onClick={() => handleLike(0)}
                         aria-label="Like"
                       >
                          <ThumbsUp className={cn("w-3.5 h-3.5", (isLiked[0] || isLiked[1]) ? "text-blue-500" : "text-gray-500")} strokeWidth={1} />
                          <span className={cn("hidden xl:inline", (isLiked[0] || isLiked[1]) ? "text-blue-500" : "text-gray-500")}>Like</span>
                           <span className={cn((isLiked[0] || isLiked[1]) ? "text-blue-500" : "text-gray-500")}>{cardData.likes}</span>
                       </button>
                      {showDislike && (
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors",
                            isDisliked && "text-red-500"
                          )}
                          onClick={handleDislike}
                          aria-label="Dislike"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline">Dislike</span>
                          <span>{dislikesCount}</span>
                        </button>
                      )}
                       <button
                         type="button"
                         className={cn(
                           "inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors",
                           hasCommented && "text-contest-blue"
                         )}
                         onClick={handleComment}
                         aria-label="Comments"
                       >
                           <MessageCircle className={cn("w-3.5 h-3.5", hasCommented ? "text-contest-blue" : "text-gray-500")} strokeWidth={1} />
                          <span className="hidden xl:inline">Comment</span>
                          <span>{cardData.comments}</span>
                       </button>
                       <button
                         type="button"
                         className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                         onClick={() => openShareModal({
                           title: `${name} - Beauty Contest`,
                           url: profileId ? `https://obcface.com/u/${profileId}` : `https://obcface.com`,
                           description: `Check out ${name}, ${age} from ${city}, ${country} in this beauty contest!`
                         })}
                         aria-label="Share"
                       >
                         <Share2 className="w-3.5 h-3.5" strokeWidth={1} />
                         <span className="hidden sm:inline">Share</span>
                       </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Empty space after voting */}
          {isVoted && !isEditing && !showThanks && (
            <div className="h-full">
            </div>
          )}
        </div>
      </div>
    </>
  );
}