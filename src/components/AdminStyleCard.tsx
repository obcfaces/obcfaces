import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import { PhotoModal } from "@/components/photo-modal";
import { getCountryDisplayName } from "@/lib/utils";

interface AdminStyleCardProps {
  rank: number;
  name: string;
  country: string;
  city: string;
  age: number;
  weight: number;
  height: number;
  rating: number;
  faceImage: string;
  fullBodyImage: string;
  additionalPhotos?: string[];
  isVoted?: boolean;
  isWinner?: boolean;
  prize?: string;
  viewMode?: 'compact' | 'full';
  onRate?: (rating: number) => void;
  profileId?: string;
  showDislike?: boolean;
  isRealContestant?: boolean;
  averageRating?: number;
  totalVotes?: number;
  isExample?: boolean;
  isThisWeek?: boolean;
  user?: any;
  weekOffset?: number;
}

export function AdminStyleCard({
  rank,
  name,
  country,
  city,
  age,
  weight,
  height,
  rating,
  faceImage,
  fullBodyImage,
  additionalPhotos = [],
  isVoted = false,
  isWinner = false,
  prize,
  viewMode = 'compact',
  onRate,
  profileId,
  user: propUser,
  showDislike = false,
  isRealContestant = false,
  averageRating = 0,
  totalVotes = 0,
  isExample = false,
  isThisWeek = false,
  weekOffset = 0
}: AdminStyleCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);

  const allPhotos = [faceImage, fullBodyImage, ...additionalPhotos];
  
  const openModal = (photoIndex: number) => {
    setModalStartIndex(photoIndex);
    setIsModalOpen(true);
  };

  const displayName = name || 'Unknown';
  const firstName = displayName.split(' ')[0];
  const lastName = displayName.split(' ').slice(1).join(' ');

  return (
    <>
      <Card className={`${isExample ? 'border-yellow-400 border-2 bg-yellow-50/50' : isWinner ? 'border-contest-blue border-2' : 'bg-card border-contest-border'} overflow-hidden relative h-[149px]`}>
        {isWinner && (
          <div className="absolute top-0 left-0 w-[193px] sm:w-[225px] md:w-[257px] bg-blue-100 text-blue-700 pl-2 pr-2 py-1 text-xs font-semibold flex items-center justify-start z-20">
            <span>🏆 WINNER + 5000 PHP</span>
          </div>
        )}

        <CardContent className="p-0">
          {/* Desktop layout */}
          <div className="hidden md:flex">
            {/* Photos section - 2 columns */}
            <div className="flex gap-px w-[25ch] flex-shrink-0">
              {faceImage && (
                <div className="w-1/2">
                  <img 
                    src={faceImage} 
                    alt="Portrait" 
                    className="w-full h-[149px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openModal(0)}
                  />
                </div>
              )}
              {fullBodyImage && (
                <div className="w-1/2 relative">
                  <img 
                    src={fullBodyImage} 
                    alt="Full length" 
                    className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openModal(1)}
                  />
                  {/* Rating in bottom right corner of second photo */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    {isWinner && (
                      <Crown className="w-3 h-3 text-yellow-400" />
                    )}
                    <span>
                      {averageRating > 0 ? averageRating.toFixed(1) : rating.toFixed(1)} ({totalVotes || 0})
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Main info section */}
            <div className="w-[50ch] flex-shrink-0 flex-1 min-w-0 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs">
                    {firstName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {displayName} #{rank}
                </span>
                {isWinner && (
                  <span className="text-xs text-blue-600 font-bold">WINNER</span>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground mb-1">
                {city}, {getCountryDisplayName(country)}
              </div>
               
              <div className="text-xs text-muted-foreground mb-1">
                {age} yo • {weight}kg • {height}cm
              </div>

              <div className="text-xs text-muted-foreground mb-1">
                Contest Participant • Rank: {rank} • Votes: {totalVotes || 0}
              </div>
            </div>

            {/* Right side - simplified for public view */}
            <div className="w-[20ch] flex-shrink-0 p-4 flex flex-col gap-2 justify-center items-center">
              {isVoted && (
                <div className="text-xs text-green-600 font-semibold">
                  Voted ✓
                </div>
              )}
              {isExample && (
                <div className="text-xs text-yellow-600 font-semibold">
                  Example
                </div>
              )}
            </div>
          </div>

          {/* Mobile layout - full width with 2 columns */}
          <div className="md:hidden">
            <div className="flex w-full relative">
              {/* Photos section - left side, full width on mobile */}
              <div className="flex gap-px w-full flex-shrink-0">
                {faceImage && (
                  <div className="w-1/2 relative">
                    <img 
                      src={faceImage} 
                      alt="Portrait" 
                      className="w-full h-[149px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openModal(0)}
                    />
                  </div>
                )}
                {fullBodyImage && (
                  <div className="w-1/2 relative">
                    <img 
                      src={fullBodyImage} 
                      alt="Full length" 
                      className="w-full h-[149px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openModal(1)}
                    />
                    {/* Rating in bottom right corner */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      {isWinner && (
                        <Crown className="w-3 h-3 text-yellow-400" />
                      )}
                      <span>
                        {averageRating > 0 ? averageRating.toFixed(1) : rating.toFixed(1)} ({totalVotes || 0})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PhotoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        photos={allPhotos}
        currentIndex={modalStartIndex}
        contestantName={name}
        age={age}
        weight={weight}
        height={height}
        country={country}
        city={city}
        onCommentSubmit={() => {}}
        shareContext={{
          title: `${name} - Beauty Contest`,
          url: profileId ? `https://obcface.com/u/${profileId}` : `https://obcface.com`,
          description: `Check out ${name}, ${age} from ${city}, ${country} in this beauty contest!`
        }}
        rating={rating}
        isVoted={isVoted}
        rank={rank}
        profileId={profileId}
        isWinner={isWinner}
        onRate={onRate}
      />
    </>
  );
}