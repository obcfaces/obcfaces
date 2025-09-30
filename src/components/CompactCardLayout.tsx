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
  localAverageRating: number;
  hideCardActions?: boolean;
  
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
  localAverageRating,
  hideCardActions,
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
    <div className="relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
      {/* Images container */}
      <div className="flex relative">
        {/* Face image */}
        <div className="relative flex-1">
          <img 
            src={faceImage} 
            alt={`${name} face`}
            className="w-full h-40 sm:h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openModal(0)}
          />
          {/* Rank number in top left corner */}
          {!isExample && rank > 0 && (!isThisWeek || isVoted) && (
            <div className="absolute top-2 left-2 bg-black/80 text-white text-sm font-bold w-6 h-6 flex items-center justify-center rounded">
              {rank}
            </div>
          )}
          {/* Example Badge */}
          {isExample && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded">
              Example
            </div>
          )}
        </div>
        
        {/* Full body image */}
        <div className="relative flex-1">
          <img 
            src={fullBodyImage} 
            alt={`${name} full body`}
            className="w-full h-40 sm:h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openModal(1)}
          />
          {/* Additional photos indicator */}
          {additionalPhotos.length > 0 && (
            <div 
              className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-black/80 transition-colors"
              onClick={() => openModal(2)}
            >
              +{additionalPhotos.length}
            </div>
          )}
        </div>
        
        {/* Rating badge in top right corner */}
        {!isEditing && !showThanks && !isExample && !isThisWeek && !hideCardActions && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-blue-500 text-white px-2 py-1 rounded text-sm font-bold">
              {localAverageRating > 0 ? localAverageRating.toFixed(1) : '0.0'}
            </div>
          </div>
        )}
      </div>
      
      {/* Content area */}
      <div className="p-3 relative">
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
        
        {/* Info section - show after voting or for examples */}
        {((!isThisWeek) || (isThisWeek && (isVoted || isExample))) && !isEditing && !showThanks && (
          <div className="space-y-2">
            {!isExample && (
              <>
                <h3 className="font-medium text-sm text-gray-900 leading-tight">
                  {profileId ? (
                    <Link to={`/u/${profileId}`} className="hover:text-blue-600 hover:underline">
                      {name}
                    </Link>
                  ) : name}
                </h3>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div>{age} yo</div>
                  <div>{weight} kg</div>
                  <div>{height} cm</div>
                </div>
              </>
            )}
            
            {/* Example bullet points */}
            {isExample && (
              <div className="text-xs text-gray-700 space-y-1">
                <div className="font-bold text-sm mb-2">Photo Requirements</div>
                <div>• Portrait and whole body</div>
                <div>• No makeup, no filters</div>
                <div>• Wear tight/fitted clothes</div>
                <div>• No dresses, glasses</div>
              </div>
            )}
            
            {!isExample && !hideCardActions && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors",
                    (isLiked[0] || isLiked[1]) && "text-blue-600"
                  )}
                  onClick={() => handleLike(0)}
                  aria-label="Like"
                >
                  <ThumbsUp className="w-3 h-3" strokeWidth={1.5} />
                  <span>{cardData.likes}</span>
                </button>
                
                <button
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors",
                    hasCommented && "text-blue-600"
                  )}
                  onClick={handleComment}
                  aria-label="Comments"
                >
                  <MessageCircle className="w-3 h-3" strokeWidth={1.5} />
                  <span>{cardData.comments}</span>
                </button>
                
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                  onClick={() => openShareModal({
                    title: `${name} - Beauty Contest`,
                    url: profileId ? `https://obcface.com/u/${profileId}` : `https://obcface.com`,
                    description: `Check out ${name}, ${age} from ${city}, ${country} in this beauty contest!`
                  })}
                  aria-label="Share"
                >
                  <Share2 className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}