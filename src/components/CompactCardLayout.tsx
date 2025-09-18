import { useState } from "react";
import { ThumbsUp, MessageCircle, Share2, ThumbsDown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn, getCountryDisplayName } from "@/lib/utils";
import { VotingOverlay } from "./VotingOverlay";

interface CompactCardLayoutProps {
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

export function CompactCardLayout({
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
}: CompactCardLayoutProps) {
  return (
    <>
      <div className="relative">
        <img 
          src={faceImage} 
          alt={`${name} face`}
          className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => openModal(0)}
        />
        {/* Example Badge on photo for compact view */}
        {isExample && (
          <div className="absolute top-0 left-0 bg-yellow-500 text-white px-1 py-0.5 text-xs font-bold">
            Example
          </div>
        )}
        {isVoted && !isExample && !isThisWeek && (
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
        {additionalPhotos.length > 0 && (
          <div 
            className="absolute bottom-0.5 right-0.5 bg-black/40 text-white/80 text-xs px-1 py-0.5 rounded cursor-pointer hover:bg-black/60 transition-colors"
            onClick={() => openModal(2)}
          >
            +{additionalPhotos.length}
          </div>
        )}
      </div>
      
      {/* Content area */}
      <div className="flex-1 p-1 sm:p-2 md:p-3 flex flex-col relative">
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
          compact={true}
        />
        
        {/* FOR PAST WEEKS: Show info ALWAYS for ALL USERS - NO CONDITIONS */}
        {!isThisWeek && (
          <div className={`absolute inset-0 rounded-r flex flex-col justify-between p-1 sm:p-2 md:p-3 ${isExample ? 'bg-yellow-100' : 'bg-white'}`}>
            <div className="flex items-start justify-between">
              {!isExample && (
                <div className="min-w-0 flex-1 mr-2">
                   <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">{profileId ? (<Link to={`/u/${profileId}`} className="hover:text-primary underline-offset-2 hover:underline">{name}</Link>) : name}</h3>
                   <div className="text-xs sm:text-sm text-muted-foreground font-normal">{age} yo · {weight} kg · {height} cm</div>
                   <div className="text-sm sm:text-base text-contest-blue truncate">
                     {getCountryDisplayName(country)} · {city}
                   </div>
                </div>
              )}
              
              {/* Example bullet points */}
              {isExample && (
                <div className="flex-1 flex items-center justify-start pl-2">
                  <div className="text-xs text-gray-700 space-y-1">
                    <div className="font-bold mb-2">Photo Requirements</div>
                    <div>• Portrait and whole body</div>
                    <div>• No makeup, no filters</div>
                    <div>• Wear tight/fitted clothes.</div>
                    <div>• No dresses, glasses</div>
                  </div>
                </div>
              )}
              
              {!isExample && (
                <div className="text-right flex-shrink-0">
                </div>
              )}
            </div>
            
            {!isExample && (
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
          </div>
        )}
        
        {/* FOR CURRENT WEEK: Show info only after voting */}
        {isThisWeek && isVoted && !isEditing && !showThanks && (
          <div className={`absolute inset-0 rounded-r flex flex-col justify-between p-1 sm:p-2 md:p-3 ${isExample ? 'bg-yellow-100' : 'bg-white'}`}>
            <div className="flex items-start justify-between">
              {!isExample && (
                <div className="min-w-0 flex-1 mr-2">
                   <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">{profileId ? (<Link to={`/u/${profileId}`} className="hover:text-primary underline-offset-2 hover:underline">{name}</Link>) : name}</h3>
                   <div className="text-xs sm:text-sm text-muted-foreground font-normal">{age} yo · {weight} kg · {height} cm</div>
                   <div className="text-sm sm:text-base text-contest-blue truncate">
                     {getCountryDisplayName(country)} · {city}
                   </div>
                </div>
              )}
              
              {!isExample && (
                <div className="text-right flex-shrink-0">
                </div>
              )}
            </div>
            
            {!isExample && (
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
          </div>
        )}
      </div>
    </>
  );
}